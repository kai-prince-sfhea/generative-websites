-- Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
-- GW-0: explicit page-local reviewed objects; native content remains authoritative.
-- Quarto's enhanced Lua error() logs and may continue; assert is a hard failure.
local function fail(message) assert(false, 'generative-websites: ' .. message) end
local native_directory=pandoc.system.get_working_directory()
local function native_root()
  if type(native_directory)~='string' or utf8.len(native_directory)==nil or native_directory:find(utf8.char(0xfffd),1,true) then fail('native input directory is unavailable') end
  local root=native_directory
  for part in (quarto.project.offset or '.'):gsub('\\','/'):gmatch('[^/]+') do
    if part=='..' then root=pandoc.path.directory(root)
    elseif part~='.' then fail('unsupported native project offset') end
  end
  return root
end
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
  if input == nil then return {enabled=true, prerequisites={}, graph_prerequisites='website', local_ai_sources=true} end
  if not mapping(input) then fail('options must be a mapping') end
  if input.enabled == false then return {enabled=false} end
  local result = {enabled=true, prerequisites={}, graph_prerequisites='website', local_ai_sources=true}
  for key,value in pairs(input) do
    if key == 'enabled' then
      if type(value) ~= 'boolean' then fail('enabled must be a boolean') end
    elseif key == 'prerequisites' then
      if not mapping(value) then fail('prerequisites must map object IDs to expressions') end
      result.prerequisites = value
    elseif key == 'local-ai-sources' then
      if type(value)~='boolean' then fail('local-ai-sources must be boolean') end
      result.local_ai_sources=value
    elseif key == 'graph-prerequisites' then
      if value==false then result.graph_prerequisites=false
      elseif value==true then result.graph_prerequisites='website'
      else local kind=pandoc.utils.type(value);if kind~='string' and kind~='Inlines' and kind~='MetaString' and kind~='MetaInlines' then fail('graph-prerequisites must be true, false or a graph ID') end;local id=pandoc.utils.stringify(value);if #id>64 or not id:match('^[a-z][a-z0-9%-]*$') then fail('graph-prerequisites must be true, false or a graph ID') end;result.graph_prerequisites=id end
    elseif key=='translations' or key=='numbas' or key=='activities' or key=='controlled-authoring' or key=='scenario-candidates' or key=='wai-adapt' or key=='project' or key=='defaults' or key=='assertions' or key=='exercises' or key=='records' or key=='reports' or key=='sandbox' or key=='sandbox-session-mappings' or key=='publication' or key=='offline' or key=='oer' or key=='catalogue' then
      -- The additive native compiler validates these closed, versioned records.
    else fail('generative-websites has an unknown option; use the installed configuration reference') end
  end
  return result
end
local expression_count = 0
local function graph_prerequisites(options,objects,source_digests)
  if options.graph_prerequisites==false or not quarto.project.directory then return end
  local root=native_root()
  local path=pandoc.path.join({root,'.quarto','knowledge-graph','run.json'})
  local file=io.open(path,'rb');if not file then return end
  local bytes=file:read(8388609);file:close()
  if not bytes or #bytes>8388608 then fail('current knowledge graph preparation exceeds its size budget') end
  local ok,run=pcall(quarto.json.decode,bytes)
  if not ok or type(run)~='table' then fail('current knowledge graph preparation is invalid; run a normal project render') end
  if run.compositionVersion~=1 or run.active~=true then return end
  if type(run.runId)~='string' or #run.runId>100 or not run.runId:match('^[A-Za-z0-9_-]+$') then fail('current knowledge graph render identity is invalid') end
  -- A completed run pointer is history, even though active describes the
  -- configured feature. Never reuse its declarations as a new render's input.
  local finalized_path=pandoc.path.join({root,'.quarto','knowledge-graph','runs',run.runId,'finalized.json'})
  local finalized=io.open(finalized_path,'rb')
  if finalized then
    local marker=finalized:read(262145);finalized:close()
    if not marker or #marker>262144 then fail('knowledge graph completion marker exceeds its size budget') end
    local valid,completed=pcall(quarto.json.decode,marker)
    if not valid or type(completed)~='table' or completed.runId~=run.runId then fail('knowledge graph completion marker is incompatible') end
    return
  end
  local prepared=run.publicPrerequisites
  if prepared==nil then return end
  if type(prepared)~='table' or prepared.version~=1 or type(prepared.objects)~='table' or type(prepared.relations)~='table' or prepared.dependencyDigest~=run.dependencyDigest then fail('current public prerequisite preparation is incompatible') end
  -- Consumers need not be declared graph sources. Quarto's current whole render
  -- inventory admits this page; renderedSources contains only extraction inputs.
  local input=pandoc.path.make_relative(quarto.doc.input_file,root,true):gsub('\\','/')
  local selected=false;for _,source in ipairs(run.allRenderedSources or {}) do if source==input then selected=true end end
  if not selected then return end
  local namespaces=prepared.namespaces or {}
  if type(namespaces)~='table' then fail('current graph namespaces are incompatible') end
  local function canonical_concept(value)
    local prefix,suffix=value:match('^([^:]+):(.+)$')
    if not prefix then fail('graph-linked concept identities require a canonical URI or a declared namespace') end
    local base=namespaces[prefix]
    if base~=nil then
      if type(base)~='string' or #base>2048 then fail('current graph namespace mapping is invalid') end
      return base..suffix
    end
    if prefix=='http' or prefix=='https' or prefix=='urn' then return value end
    fail('a graph-linked learning concept uses an undeclared namespace; use its full HTTP(S)/URN identity, declare the prefix in the shared catalogue, or disable graph-prerequisites')
  end
  local by_concept,public={},{ }
  for _,object in ipairs(objects) do
    local canonical=canonical_concept(object.conceptId)
    if by_concept[canonical] then fail('graph prerequisites require a unique canonical concept identity for each reviewed learning object on the page; aliases cannot identify two different learning objects') end
    by_concept[canonical]=object
  end
  for _,object in ipairs(prepared.objects) do if object.graphId==options.graph_prerequisites then public[object.id]=true end end
  local dependencies={}
  for _,relation in ipairs(prepared.relations) do
    if relation.graphId==options.graph_prerequisites and public[relation.from] and public[relation.to] then
      local owner=by_concept[relation.from]
      if owner and options.prerequisites[owner.id]==nil then
        local bucket=dependencies[owner.id] or {};dependencies[owner.id]=bucket
        local group=relation.group or ''
        bucket[group]=bucket[group] or {};bucket[group][relation.to]=true
      end
    end
  end
  for id,bucket in pairs(dependencies) do
    local expressions=array();local groups={};for group,_ in pairs(bucket) do groups[#groups+1]=group end;table.sort(groups)
    for _,group in ipairs(groups) do
      local targets={};for target,_ in pairs(bucket[group]) do targets[#targets+1]=target end;table.sort(targets)
      if #targets>50 then fail('a graph prerequisite group exceeds 50 concepts') end
      local alternatives=array()
      for _,target in ipairs(targets) do
        expression_count=expression_count+1;if expression_count>512 then fail('combined prerequisites exceed 512 expression nodes') end
        local native=by_concept[target]
        local reference={ref=native and native.id or ('gw-external-'..pandoc.utils.sha1(target))}
        if group=='' then expressions[#expressions+1]=reference else alternatives[#alternatives+1]=reference end
      end
      if group~='' then if #alternatives>1 then expression_count=expression_count+1 end;expressions[#expressions+1]=#alternatives==1 and alternatives[1] or {any=alternatives} end
    end
    if #expressions>50 then fail('a graph prerequisite owner exceeds 50 groups') end
    if #expressions>1 then expression_count=expression_count+1 end
    if expression_count>512 then fail('combined prerequisites exceed 512 expression nodes') end
    if #expressions>0 then for _,object in ipairs(objects) do if object.id==id then object.prerequisite=#expressions==1 and expressions[1] or {all=expressions} end end end
  end
  source_digests[#source_digests+1]={id='public-graph-prerequisites',digest=pandoc.utils.sha1(encode(prepared)..options.graph_prerequisites)}
end
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
  local local_ai_panel=false
  local selected_originals = {}
  local function record(el)
    if el.identifier and el.identifier ~= '' then anchors[el.identifier]=(anchors[el.identifier] or 0)+1 end
    if el.t ~= 'Div' then return end
    if has(el,'local-ai') then local_ai_panel=true end
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
  for object_index,el in ipairs(all_objects) do
    local location='learning object occurrence ' .. object_index
    pandoc.Div(el.content):walk({Div=function(child)
      if has(child,'learning-object') then fail('learning objects cannot be nested, including through wrappers or views') end
      if has(child,'generative-route') then fail('route panels cannot be nested inside learning objects') end
    end})
    local status=el.attributes.review
    if status ~= 'author-reviewed' and status ~= 'candidate' then fail('learning objects require review="author-reviewed" or review="candidate"') end
    if status == 'author-reviewed' then
      if #objects >= 50 then fail('at most 50 reviewed objects are supported per document') end
      local id=identifier(el.identifier,'learning object ID')
      if anchors[id] ~= 1 then fail(location .. '.id is a duplicate native object anchor; assign a unique native ID') end
      -- Bind common assumptions/prose as well as the two view realisations.
      -- This runs after native visibility, before adding generated labels/IDs.
      source_digests[#source_digests+1]={id=id,digest=pandoc.utils.sha1(pandoc.write(pandoc.Pandoc(el.content),'json'))}
      local concept=text(el.attributes['concept-id'] or el.attributes['semantic-id'],location .. '.concept-id (or shared semantic-id)',512)
      if el.attributes['concept-id'] and el.attributes['semantic-id'] and el.attributes['concept-id']~=el.attributes['semantic-id'] then fail(location .. ' concept-id conflicts with its shared semantic-id') end
      local unsafe=false
      for _,cp in utf8.codes(concept) do if whitespace(cp) then unsafe=true end end
      if not concept:match('^[A-Za-z][A-Za-z0-9+%.%-]*:.+') or unsafe or concept:find('[<>"\']') then
        fail('concept-id must be a scoped URI without whitespace or unsafe delimiters')
      end
      local item={id=id,conceptId=concept,revision=text(el.attributes.revision,location .. '.revision',128),
        label=text(el.attributes.label,location .. '.label',256),context=text(el.attributes.context,location .. '.context',128),
        reviewedBy=text(el.attributes['reviewed-by'],location .. '.reviewed-by',256),views=array(),prerequisite=NULL}
      local levels={}
      for _,child in ipairs(el.content) do
        if child.t == 'Div' and has(child,'learning-object') then fail('learning objects cannot be nested') end
        if child.t == 'Div' and has(child,'learning-view') then
          local level=child.attributes.level
          if level ~= 'introductory' and level ~= 'advanced' then fail('views require level="introductory" or level="advanced"') end
          if levels[level] then fail(location .. ' has a duplicate ' .. level .. ' view; keep one direct view of each supported level') end
          if child.attributes.review ~= 'author-reviewed' then fail('every selected view requires explicit review="author-reviewed"') end
          local anchor=id .. '--' .. level
          if child.identifier ~= '' then fail('view IDs are generated; remove the authored view ID') end
          if anchors[anchor] then fail(location .. ' generated view anchor collides with native content; change the object ID or conflicting native ID') end
          anchors[anchor]=1
          child.identifier=anchor
          child.attributes['data-learning-level']=level
          child.attributes['data-learning-object']=id
          local revision=text(child.attributes.revision,location .. '.' .. level .. '.revision',128)
          local reviewer=text(child.attributes['reviewed-by'],location .. '.' .. level .. '.reviewed-by',256)
          local digest=pandoc.utils.sha1(pandoc.write(pandoc.Pandoc(child.content),'json'))
          item.views[#item.views+1]={level=level,revision=revision,reviewedBy=reviewer,anchor=anchor,digest=digest}
          levels[level]=true
          child.content:insert(1,pandoc.Para({pandoc.Strong({pandoc.Str(level == 'introductory' and 'Introductory view' or 'Advanced view')})}))
        end
      end
      if not levels.introductory or not levels.advanced then fail(location .. ' requires one direct introductory and one direct advanced view') end
      objects[#objects+1]=item
      selected[id]=item
      selected_originals[id]=el
      if local_ai_panel and options.local_ai_sources then
        local protected=false
        pandoc.Div(el.content):walk({Div=function(child)
          local role=child.attributes['data-learning-role'] or child.attributes['learning-role']
          if role=='hint' or role=='solution' or role=='answer' or role=='feedback' or has(child,'generative-solution') or has(child,'generative-answer') then protected=true end
        end})
        if not protected then
          if not has(el,'local-ai-source') then el.classes:insert('local-ai-source') end
          if not el.attributes['data-source-label'] then el.attributes['data-source-label']=item.label end
        end
      end
    end
  end
  if #objects == 0 then fail('a route panel requires at least one explicitly reviewed learning object') end
  local prerequisite_index, unbound_count = 0, 0
  for key,value in pairs(options.prerequisites) do
    prerequisite_index=prerequisite_index+1
    local id=identifier(key,'prerequisite owner')
    local expression=prerequisite(value,1)
    if selected[id] then selected[id].prerequisite=expression
    else
      unbound_count=unbound_count+1
      if unbound_count<=5 then quarto.log.warning('generative-websites: prerequisite entry occurrence ' .. prerequisite_index .. ' has an absent or unreviewed owner on this page; check its owner against this page or remove the entry from its effective map') end
    end
  end
  if unbound_count>5 then quarto.log.warning('generative-websites: ' .. unbound_count .. ' prerequisite owners are absent or unreviewed on this page; only the first five processing occurrences are reported; review the effective prerequisites map') end
  graph_prerequisites(options,objects,source_digests)
  local goal=panels[1].attributes.goal and identifier(panels[1].attributes.goal,'route goal') or objects[1].id
  if not selected[goal] then fail('route panel.goal is missing or unreviewed; select a reviewed object on this page') end
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
      return selected_originals[el.identifier]
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
  if html then quarto.doc.add_html_dependency({name='generative-websites',version='0.0.12',
    -- Original modules are preassembled at development time; no relative imports
    -- remain when Pandoc embeds the browser entry in a data URL.
    scripts={{path='generative-websites-browser.js',attribs={type='module'}}},
    stylesheets={'generative-websites.css'}}) end
  return doc
end
-- PANDOC_SCRIPT_FILE is the native UTF-8 path. On the tested Windows host,
-- debug source names/relative require search paths use the system encoding.
-- Load the installed sibling by its exact native path, without recoding names.
if type(PANDOC_SCRIPT_FILE)~='string' or utf8.len(PANDOC_SCRIPT_FILE)==nil or PANDOC_SCRIPT_FILE:find(utf8.char(0xfffd),1,true) then fail('native extension path is unavailable') end
local runtime_directory=pandoc.path.directory(PANDOC_SCRIPT_FILE)
if not pandoc.path.is_absolute(runtime_directory) then runtime_directory=pandoc.path.normalize(pandoc.path.join({native_directory,runtime_directory})) end
local features=dofile(pandoc.path.join({runtime_directory,'features.lua'}))
return {Pandoc=function(doc)return features.process(process(doc),runtime_directory,native_directory,native_root)end}
