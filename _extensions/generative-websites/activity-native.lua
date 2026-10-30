-- Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
-- R5 private draft. Native AST only; no files, metadata reparsing or renderer.
-- Only ordinary document/Div nesting is admitted. Other containers stay readable
-- but cannot silently acquire current public activity/progress identities.
local M={}
local function fail()assert(false,'generative-websites: activity parts must be unique current public native blocks outside hidden, conditional and alternate views')end
local function has(el,name)return el.classes and el.classes:includes(name)end
local function token(value)
  if type(value)~='string'or #value>128 or not value:match('^[A-Za-z][A-Za-z0-9._:%-]*$')or value=='constructor'or value=='prototype'then fail()end
  return value
end
local function blocked(el)
  local a=el.attributes or{}
  if a.public=='false'or a.publish=='false'or a.consent=='false'or a.visibility=='private'or a.audience=='private'or a.hidden~=nil or a.inert~=nil or a['aria-hidden']=='true'then return true end
  for _,name in ipairs({'private','hidden','content-hidden','content-visible','learning-view','learning-variant'})do if has(el,name)then return true end end
  for key in pairs(a)do if key:match('^when%-')or key:match('^unless%-')or key=='if'or key=='unless'then return true end end
  return false
end
local known={objective=true,task=true,hint=true,solution=true,debrief=true,feedback=true,['reflection-prompt']=true}
local function role(el)local a=el.attributes or{};return a['learning-role']or a['data-learning-role']end
local function projection(el)return pandoc.write(pandoc.Pandoc(el.content),'json')end
function M.capture(doc)
  local anchors,all,count={}, {},0
  local reserved=false
  local function anchor(el)
    if el.identifier and el.identifier~=''then anchors[el.identifier]=(anchors[el.identifier]or 0)+1;count=count+1 end
    if el.t=='Div'and has(el,'learning-activity')then all[#all+1]=el;if #all>32 then fail()end end
  end
  doc:walk({Div=anchor,Span=anchor,Header=anchor,CodeBlock=anchor,Code=anchor,Link=anchor,Image=anchor,Table=anchor,Figure=anchor,
    RawBlock=function(el)if el.format:match('html')and el.text:find('generative%-activities%-data')then reserved=true end end})
  if #all==0 then return pandoc.List(),pandoc.List()end
  if count>20000 then fail()end
  if reserved then fail()end
  local observations,publicSources=pandoc.List(),pandoc.List()
  local function inspect(activity)
    local id=token(activity.identifier);if anchors[id]~=1 then fail()end
    local parts,seen,unsafe=pandoc.List(),{},false
    local function descend(blocks,depth)
      if depth>32 then fail()end
      for _,el in ipairs(blocks)do
        if el.t=='Div'then
          if blocked(el)or has(el,'learning-activity')then unsafe=true
          else
            local value=role(el)
            if value then
              if not known[value]then unsafe=true
              else
                local partId=token(el.identifier);if anchors[partId]~=1 or seen[partId]then fail()end
                local text=projection(el);if #text>65536 then fail()end
                local item={id=partId,role=value,sourceText=text}
                local feedback=el.attributes['learning-feedback']or el.attributes['data-learning-feedback']
                if value=='feedback'then if feedback~='correct'and feedback~='incorrect'and feedback~='invalid'and feedback~='unavailable'then fail()end;item.feedback=feedback
                elseif feedback~=nil then fail()end
                parts:insert(item);seen[partId]=true
                -- A role is one complete part, not a container for other parts.
                local function inside(child)if role(child)or has(child,'learning-activity')or blocked(child)then unsafe=true end end
                el.content:walk({Div=inside,Span=inside,Header=inside,CodeBlock=inside,Code=inside,Link=inside,Image=inside,Table=inside,Figure=inside,
                  RawBlock=function()unsafe=true end})
              end
            else descend(el.content,depth+1)end
          end
        else
          -- Unknown block nesting is not guessed as ordinary activity content.
          if el.walk then el:walk({Div=function(child)if role(child)or has(child,'learning-activity')then unsafe=true end end})end
        end
      end
    end
    descend(activity.content,1)
    activity.content:walk({Div=function(el)if role(el)and not seen[el.identifier]then unsafe=true end end})
    if not unsafe then if #parts>31 then fail()end;observations:insert({id=id,parts=parts})end
  end
  local function traverse(blocks,hidden,depth)
    if depth>32 then fail()end
    for _,el in ipairs(blocks)do if el.t=='Div'then
      local hiddenHere=hidden or blocked(el)
      if not hiddenHere and(has(el,'learning-object')or has(el,'adaptive-object')or has(el,'controlled-assertion'))and el.attributes.review=='author-reviewed'then
        local sourceId=token(el.identifier);if anchors[sourceId]~=1 or #publicSources>=50 then fail()end;publicSources:insert(sourceId)
      end
      if has(el,'learning-activity')then if not hiddenHere then inspect(el)end
      else traverse(el.content,hiddenHere,depth+1)end
    end end
  end
  traverse(doc.blocks,false,1)
  -- An unconfigured/unadmitted activity remains ordinary native text. A YAML
  -- declaration selecting it will be refused by the compiler as unavailable.
  return observations,publicSources
end
-- Reuse exactly the already-generated exercise block, immediately after its
-- authored task. The caller appends only panels not returned in used.
function M.place(doc,data,exercisePanels)
  if type(data)~='table' then return doc,{}end
  local byId,used={},{}
  for _,record in ipairs(data.records or{})do byId[record.id]=record end
  doc=doc:walk({Div=function(el)
    local record=byId[el.identifier]
    if not record then return nil end
    if not has(el,'learning-activity')then fail()end
    el.attributes['data-gw-activity']=record.id
    local practice=record.practice
    if type(practice)=='table' and practice.kind=='exercise'then
      local panel=exercisePanels[practice.id];if not panel or used[practice.id]then fail()end
      local inserted=0
      el.content=el.content:walk({Div=function(part)
        if part.identifier==record.task.id then inserted=inserted+1;return{part,panel}end
      end})
      if inserted~=1 then fail()end;used[practice.id]=true
    end
    return el
  end})
  return doc,used
end
return M
