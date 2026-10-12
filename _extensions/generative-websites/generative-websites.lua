-- Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
-- GW-0: explicit page-local reviewed objects; native content remains authoritative.
-- Quarto's enhanced Lua error() logs and may continue; assert is a hard failure.
local function fail(message) assert(false, 'generative-websites: ' .. message) end
local function has(el, name) return el.classes and el.classes:includes(name) end
-- Match JavaScript trim/whitespace by code point, not Windows locale byte classes.
local function whitespace(cp)
  return cp and (cp >= 9 and cp <= 13 or cp == 32 or cp == 160 or cp == 5760 or
    cp >= 8192 and cp <= 8202 or cp == 8232 or cp == 8233 or cp == 8239 or
    cp == 8287 or cp == 12288 or cp == 65279)
end
local function text(value, field, limit)
  if value == nil then fail(field .. ' is required') end
  local value = pandoc.utils.stringify(value)
  local first,last,control
  for _,cp in utf8.codes(value) do
    first=first or cp;last=cp
    if cp < 32 or cp == 127 then control=true end
  end
  if not first or whitespace(first) or whitespace(last) or #value > limit or control then
    fail(field .. ' requires nonblank text within ' .. limit .. ' UTF-8 bytes, without control characters')
  end
  return value
end
local function identifier(value, field)
  local value = text(value, field, 128)
  if not value:match('^[A-Za-z][A-Za-z0-9._:%-]*$') or value == 'constructor' or value == 'prototype' then
    fail(field .. ' must be a native ID starting with a letter and containing only letters, digits, . _ : -')
  end
  return value
end
local NULL = {}
local function array() return setmetatable({}, {__array=true}) end
-- Canonical encoding also preserves empty arrays and explicit JSON null.
local function encode(value)
  if value == NULL then return 'null' end
  if type(value) ~= 'table' then return quarto.json.encode(value) end
  local parts = {}
  if getmetatable(value) and getmetatable(value).__array then
    for _,item in ipairs(value) do parts[#parts+1] = encode(item) end
    return '[' .. table.concat(parts, ',') .. ']'
  end
  local keys = {}
  for key in pairs(value) do keys[#keys+1] = key end
  table.sort(keys)
  for _,key in ipairs(keys) do parts[#parts+1] = quarto.json.encode(key) .. ':' .. encode(value[key]) end
  return '{' .. table.concat(parts, ',') .. '}'
end
local function mapping(value)
  local kind = pandoc.utils.type(value)
  return kind == 'MetaMap' or kind == 'table'
end
local function config(meta)
  local input = meta['generative-websites']
  if input == nil then return {enabled=true, prerequisites={}} end
  if not mapping(input) then fail('options must be a mapping') end
  if input.enabled == false then return {enabled=false} end
  local result = {enabled=true, prerequisites={}}
  for key,value in pairs(input) do
    if key == 'enabled' then
      if type(value) ~= 'boolean' then fail('enabled must be a boolean') end
    elseif key == 'prerequisites' then
      if not mapping(value) then fail('prerequisites must map object IDs to expressions') end
      result.prerequisites = value
    else fail('unknown option ' .. tostring(key)) end
  end
  return result
end
local expression_count = 0
local function prerequisite(value, depth)
  expression_count = expression_count + 1
  if depth > 16 or expression_count > 512 then fail('prerequisites exceed depth 16 or 512 expression nodes') end
  local kind = pandoc.utils.type(value)
  if kind == 'string' or kind == 'Inlines' or kind == 'MetaString' or kind == 'MetaInlines' then
    return {ref=identifier(value, 'prerequisite reference')}
  end
  if not mapping(value) then fail('a prerequisite must be an object ID or an all/any mapping') end
  local operator, members, count
  count = 0
  for key,item in pairs(value) do operator=key; members=item; count=count+1 end
  if count ~= 1 or (operator ~= 'all' and operator ~= 'any') then fail('a prerequisite mapping requires exactly one of all or any') end
  local member_kind = pandoc.utils.type(members)
  if member_kind ~= 'List' and member_kind ~= 'MetaList' then fail(operator .. ' requires a nonempty YAML list') end
  if #members == 0 or #members > 50 then fail(operator .. ' requires between 1 and 50 members') end
  local children = array()
  for _,item in ipairs(members) do children[#children+1] = prerequisite(item, depth+1) end
  return {[operator]=children}
end
-- Same first-feasible authored-branch policy as route.js; no optimality claim.
local function route(objects, goal)
  local by_id, done, visiting, steps, visits = {}, {}, {}, array(), 0
  for _,item in ipairs(objects) do by_id[item.id]=item end
  local context = by_id[goal] and by_id[goal].context
  local visit, expression
  expression = function(value, parent)
    if value == NULL then return true end
    if value.ref then return visit(value.ref, parent) end
    if value.all then
      for _,item in ipairs(value.all) do local ok,why=expression(item,parent); if not ok then return false,why end end
      return true
    end
    local reasons = {}
    for _,item in ipairs(value.any) do
      local saved_done, saved_steps = {}, #steps
      for key,result in pairs(done) do saved_done[key]=result end
      local ok,why=expression(item,parent)
      if ok then return true end
      done=saved_done
      while #steps > saved_steps do table.remove(steps) end
      reasons[#reasons+1]=why
    end
    local message='No available alternative: ' .. table.concat(reasons, '; ')
    return false, #message > 2048 and (message:sub(1,2045) .. '...') or message
  end
  visit = function(id, parent)
    visits=visits+1
    if visits > 20000 then return false, 'Route search budget exceeded (20000 object visits)' end
    local item=by_id[id]
    if not item then return false, 'Missing or unreviewed object #' .. id end
    if item.context ~= context then return false, 'Incompatible context at #' .. id end
    if done[id] then return true end
    if visiting[id] then return false, 'Prerequisite cycle at #' .. id end
    visiting[id]=true
    local ok,why=expression(item.prerequisite,id)
    visiting[id]=nil
    if not ok then return false,why end
    done[id]=true
    steps[#steps+1]={id=id,reason=parent and ('Prerequisite for #' .. parent) or 'Selected goal'}
    return true
  end
  local ok,why=visit(goal,nil)
  if not ok then return nil,why end
  return steps
end
local function process(doc)
  expression_count=0
  local options=config(doc.meta)
  if not options.enabled then return doc end
  local anchors, objects, panels, selected, all_objects, source_digests = {}, array(), {}, {}, {}, array()
  local function record(el)
    if el.identifier and el.identifier ~= '' then anchors[el.identifier]=(anchors[el.identifier] or 0)+1 end
    if el.t ~= 'Div' then return end
    if has(el,'generative-route') then panels[#panels+1]=el end
    if has(el,'learning-object') then all_objects[#all_objects+1]=el end
  end
  doc:walk({Div=record,Span=record,Header=record,Code=record,CodeBlock=record,Link=record,Image=record,Table=record,Figure=record})
  if #panels == 0 then return doc end
  if #panels ~= 1 then fail('at most one .generative-route is supported per document') end
  if has(panels[1],'learning-object') then fail('a route panel cannot also be a learning object') end
  pandoc.Div(panels[1].content):walk({Div=function(child)
    if has(child,'learning-object') or has(child,'learning-view') then fail('route panels cannot contain learning objects or views') end
  end})
  for _,el in ipairs(all_objects) do
    pandoc.Div(el.content):walk({Div=function(child)
      if has(child,'learning-object') then fail('learning objects cannot be nested, including through wrappers or views') end
      if has(child,'generative-route') then fail('route panels cannot be nested inside learning objects') end
    end})
    local status=el.attributes.review
    if status ~= 'author-reviewed' and status ~= 'candidate' then fail('learning objects require review="author-reviewed" or review="candidate"') end
    if status == 'author-reviewed' then
      if #objects >= 50 then fail('at most 50 reviewed objects are supported per document') end
      local id=identifier(el.identifier,'learning object ID')
      if anchors[id] ~= 1 then fail('duplicate native object anchor #' .. id) end
      -- Bind common assumptions/prose as well as the two view realisations.
      -- This runs after native visibility, before adding generated labels/IDs.
      source_digests[#source_digests+1]={id=id,digest=pandoc.utils.sha1(pandoc.write(pandoc.Pandoc(el.content),'json'))}
      local concept=text(el.attributes['concept-id'],'concept-id for #' .. id,512)
      local unsafe=false
      for _,cp in utf8.codes(concept) do if whitespace(cp) then unsafe=true end end
      if not concept:match('^[A-Za-z][A-Za-z0-9+%.%-]*:.+') or unsafe or concept:find('[<>"\']') then
        fail('concept-id must be a scoped URI without whitespace or unsafe delimiters')
      end
      local item={id=id,conceptId=concept,revision=text(el.attributes.revision,'revision for #' .. id,128),
        label=text(el.attributes.label,'label for #' .. id,256),context=text(el.attributes.context,'context for #' .. id,128),
        reviewedBy=text(el.attributes['reviewed-by'],'reviewed-by for #' .. id,256),views=array(),prerequisite=NULL}
      local levels={}
      for _,child in ipairs(el.content) do
        if child.t == 'Div' and has(child,'learning-object') then fail('learning objects cannot be nested') end
        if child.t == 'Div' and has(child,'learning-view') then
          local level=child.attributes.level
          if level ~= 'introductory' and level ~= 'advanced' then fail('views require level="introductory" or level="advanced"') end
          if levels[level] then fail('duplicate ' .. level .. ' view for #' .. id) end
          if child.attributes.review ~= 'author-reviewed' then fail('every selected view requires explicit review="author-reviewed"') end
          local anchor=id .. '--' .. level
          if child.identifier ~= '' then fail('view IDs are generated; remove the authored view ID') end
          if anchors[anchor] then fail('generated view anchor #' .. anchor .. ' collides with native content') end
          anchors[anchor]=1
          child.identifier=anchor
          child.attributes['data-learning-level']=level
          child.attributes['data-learning-object']=id
          local revision=text(child.attributes.revision,'view revision for #' .. id,128)
          local reviewer=text(child.attributes['reviewed-by'],'view reviewed-by for #' .. id,256)
          local digest=pandoc.utils.sha1(pandoc.write(pandoc.Pandoc(child.content),'json'))
          item.views[#item.views+1]={level=level,revision=revision,reviewedBy=reviewer,anchor=anchor,digest=digest}
          levels[level]=true
          child.content:insert(1,pandoc.Para({pandoc.Strong({pandoc.Str(level == 'introductory' and 'Introductory view' or 'Advanced view')})}))
        end
      end
      if not levels.introductory or not levels.advanced then fail('#' .. id .. ' requires one direct introductory and one direct advanced view') end
      objects[#objects+1]=item
      selected[id]=item
    end
  end
  if #objects == 0 then fail('a route panel requires at least one explicitly reviewed learning object') end
  for key,value in pairs(options.prerequisites) do
    local id=identifier(key,'prerequisite owner')
    local expression=prerequisite(value,1)
    if selected[id] then selected[id].prerequisite=expression
    else quarto.log.warning('generative-websites: prerequisite owner #' .. id .. ' is absent or unreviewed on this page; its project entry is not bound here') end
  end
  local goal=panels[1].attributes.goal and identifier(panels[1].attributes.goal,'route goal') or objects[1].id
  if not selected[goal] then fail('route goal #' .. goal .. ' is missing or unreviewed') end
  local level=panels[1].attributes.level or 'introductory'
  if level ~= 'introductory' and level ~= 'advanced' then fail('route level must be introductory or advanced') end
  local language=doc.meta.lang and text(doc.meta.lang,'document lang',64) or 'en'
  if language ~= 'en' then fail('GW-0 currently supports lang: en only; translation is a separate future gate') end
  local payload={version=0,language=language,objects=objects,defaultGoal=goal,defaultLevel=level}
  payload.snapshot=pandoc.utils.sha1(encode(payload) .. encode(source_digests))
  local steps,why=route(objects,goal)
  local native=pandoc.List({pandoc.Para({pandoc.Strong({pandoc.Str('Default learning route')})})})
  if steps then
    local entries={}
    for _,step in ipairs(steps) do entries[#entries+1]={pandoc.Plain({pandoc.Link({pandoc.Str(selected[step.id].label)},'#' .. step.id),pandoc.Str(' — ' .. step.reason)})} end
    native:insert(pandoc.OrderedList(entries))
  else native:insert(pandoc.Para({pandoc.Str('Route unavailable: ' .. why)})) end
  native:insert(pandoc.Para({pandoc.Str('Both authored views remain below. Prerequisites describe pedagogical preparation; review is declared by the author.')}))
  local html=quarto.doc.is_format('html:js')
  doc.blocks=doc.blocks:walk({Div=function(el)
    if has(el,'learning-object') and selected[el.identifier] then
      -- Replace with the enriched original AST, never model/generated prose.
      for _,original in ipairs(all_objects) do if original.identifier == el.identifier then return original end end
    elseif has(el,'generative-route') then
      el.content:insert(pandoc.Div(native,pandoc.Attr('',{'generative-websites-fallback'})))
      if html then
        local json=encode(payload):gsub('<','\\u003c'):gsub('>','\\u003e'):gsub('&','\\u0026')
          :gsub(utf8.char(0x2028),'\\u2028'):gsub(utf8.char(0x2029),'\\u2029')
        el.content:insert(pandoc.RawBlock('html','<div class="generative-websites-enhancement" hidden></div><script type="application/json" class="generative-websites-data">' .. json .. '</script>'))
      end
      return el
    end
  end})
  if html then quarto.doc.add_html_dependency({name='generative-websites',version='0.0.2',
    -- Original modules are preassembled at development time; no relative imports
    -- remain when Pandoc embeds the browser entry in a data URL.
    scripts={{path='generative-websites-browser.js',attribs={type='module'}}},
    stylesheets={'generative-websites.css'}}) end
  return doc
end
return {Pandoc=process}
