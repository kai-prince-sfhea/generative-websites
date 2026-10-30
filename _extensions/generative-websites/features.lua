-- Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
-- Native authored content is authoritative; the installed helper only validates
-- finite data and prepares explicit public projections. It invokes no AI.
local M={}
local function fail()assert(false,'generative-websites: cannot prepare the selected reviewed features; check the installed reference, explicit revisions and public source selection')end
local function has(el,name)return el.classes and el.classes:includes(name)end
local function nonpublic(el)
  local a=el.attributes or{}
  return a.public=='false'or a.consent=='false'or a.visibility=='private'or a.audience=='private'or has(el,'private')or has(el,'content-hidden')
end
local function excluded(el)
  local a=el.attributes or{};local role=a['learning-role']or a['data-learning-role']
  if nonpublic(el)or a.hidden~=nil or a.inert~=nil or a['aria-hidden']=='true'or role=='hint'or role=='solution'or role=='answer'or role=='feedback'or role=='post-attempt'or role=='evidence'or role=='objection'or role=='qualification'then return true end
  for _,c in ipairs(el.classes or{})do if c=='hidden'or c=='learning-variant'or c=='generative-answer'or c=='generative-solution'or c=='generative-feedback'or c:match('^content%-')then return true end end
  return false
end
local function str(value)return value~=nil and pandoc.utils.stringify(value)or nil end
local function text(value,limit)
  local s=str(value);if not s or s=='' or #s>(limit or 256) or s:find('[%z\1-\31\127]')then fail()end;return s
end
local function token(value)
  local s=text(value,128);if not s:match('^[A-Za-z][A-Za-z0-9._:%-]*$')or s=='constructor'or s=='prototype'then fail()end;return s
end
local function plain(value,depth)
  depth=(depth or 0)+1;if depth>32 then fail()end
  local kind=pandoc.utils.type(value)
  if type(value)=='boolean'or type(value)=='number'or type(value)=='string'then return value end
  if kind=='List'or kind=='MetaList'then local a=pandoc.List();for _,v in ipairs(value)do a:insert(plain(v,depth))end;return a end
  if kind=='Inlines'or kind=='MetaInlines'or kind=='MetaString'then return pandoc.utils.stringify(value)end
  if type(value)=='table'then local o={};for k,v in pairs(value)do if type(k)~='string'then fail()end;o[k]=plain(v,depth)end;return o end
  fail()
end
local function json(value)return pandoc.json.encode(value)end
local function escaped(value)return json(value):gsub('<','\\u003c'):gsub('>','\\u003e'):gsub('&','\\u0026'):gsub(utf8.char(0x2028),'\\u2028'):gsub(utf8.char(0x2029),'\\u2029')end
local function source(el)
  local blocks=el.t=='Span'and{pandoc.Para(el.content)}or el.content
  return pandoc.write(pandoc.Pandoc(blocks),'json')
end
local function digest(el)return 'sha1:'..pandoc.utils.sha1(source(el))end
local function native_location(cwd,root)
  local input=quarto.doc.input_file
  if not pandoc.path.is_absolute(input)then input=pandoc.path.join({cwd,input})end
  input=pandoc.path.normalize(input)
  root=pandoc.path.normalize(root)
  local output=quarto.doc.output_file
  if not pandoc.path.is_absolute(output)then output=pandoc.path.join({pandoc.path.directory(input),output})end
  output=pandoc.path.normalize(output)
  local outputSuffix=pandoc.path.make_relative(output,root,true):gsub('\\','/')
  if outputSuffix=='..'or outputSuffix:match('^%.%./')or pandoc.path.is_absolute(outputSuffix)then fail()end
  -- Quarto permits a filename for output-file, and preserves the input's
  -- project-relative directory when it moves that intermediate to output-dir.
  -- Derive the public suffix from native input/filename, not ANSI metadata or
  -- a pre-move output path relative to the final directory.
  local parent=pandoc.path.make_relative(pandoc.path.directory(input),root,true):gsub('\\','/')
  if parent=='..'or parent:match('^%.%./')or pandoc.path.is_absolute(parent)then fail()end
  local page=(parent=='.'and''or parent..'/')..pandoc.path.filename(output)
  local offset=quarto.project.offset or '.'
  offset=offset:gsub('\\','/')
  if offset=='.'then offset='./'else offset=offset..'/'end
  return root,pandoc.path.directory(input),page,offset
end
function M.process(doc,runtime,native_directory,project_root)
  local raw=doc.meta['generative-websites']
  local numbasAPI=dofile(pandoc.path.join({runtime,'numbas','native.lua'}))
  local numbasRoot=project_root();local numbasSource=numbasAPI.context(native_directory,numbasRoot)
  local numbasOwned=numbasAPI.has_owned(numbasRoot,numbasSource)
  if raw and raw.enabled==false then return numbasAPI.disabled(doc,runtime,native_directory,numbasRoot)end
  local professional=doc.meta['interactive-cv']~=nil
  if not professional then doc:walk({Div=function(el)if has(el,'cv-index')then professional=true end end})end
  if professional and quarto.doc.is_format('html:js')then
    quarto.doc.add_html_dependency({name='generative-websites-professional',version='0.0.13',scripts={{path='professional-browser.js',attribs={type='module'}}}})
  end
  local options=raw and plain(raw)or{}
  local translationAPI=dofile(pandoc.path.join({runtime,'translation-native.lua'}))
  local translationRows=translationAPI.capture(doc,options.translations)
  local all,anchors,panels,roles={}, {}, {}, {}
  local controlled,realisations=pandoc.List(),pandoc.List()
  local scenarioRows,symbolRows=pandoc.List(),pandoc.List();local scenarioBlocked,symbolBlocked,scenarioCaptured={},{},{}
  local function restrict(el)
    if el.identifier and el.identifier~=''then scenarioBlocked[el.identifier]=true;symbolBlocked[el.identifier]=true end
    el:walk({Div=function(v)if v.identifier~=''then scenarioBlocked[v.identifier]=true end end,Span=function(v)if v.identifier~=''then symbolBlocked[v.identifier]=true end end})
    return el,false
  end
  local function pilotGuard(el)if excluded(el)then return restrict(el)end end
  doc:walk({traverse='topdown',Div=pilotGuard,Span=pilotGuard,BlockQuote=restrict,Cite=restrict,Quoted=restrict,Table=restrict})
  local restricted={}
  local function guarded(el)
    if nonpublic(el)or el.attributes.hidden~=nil or el.attributes.inert~=nil or el.attributes['aria-hidden']=='true'then
      el:walk({Div=function(child)if has(child,'controlled-assertion')or has(child,'reviewed-realisation')then restricted[child.identifier]=true end end})
      return el,false
    end
  end
  doc:walk({traverse='topdown',Div=guarded})
  local active=options.catalogue~=nil
  for _,key in ipairs({'translations','numbas','activities','controlled-authoring','scenario-candidates','wai-adapt','project','defaults','assertions','exercises','records','reports','sandbox','sandbox-session-mappings','publication','offline','oer'})do if options[key]~=nil then active=true end end
  local function record(el)
    if el.identifier and el.identifier~=''then anchors[el.identifier]=(anchors[el.identifier]or 0)+1 end
    if el.t=='Div'and has(el,'learning-activity')then active=true end
    if el.t=='Div'and(has(el,'adaptive-object')or has(el,'learning-object')or has(el,'controlled-assertion'))then all[#all+1]=el;if has(el,'adaptive-object')or has(el,'controlled-assertion')then active=true end end
    if el.t=='Div'and has(el,'reviewed-realisation')then
      if restricted[el.identifier]or nonpublic(el)or el.attributes.public~='true'or el.attributes.hidden~=nil or el.attributes.inert~=nil or el.attributes['aria-hidden']=='true'then fail()end
      if el.attributes.required~=nil and el.attributes.required~='true'and el.attributes.required~='false'then fail()end
      realisations:insert({id=token(el.identifier),revision=text(el.attributes.revision,128),source=token(el.attributes.source),lexicon=text(el.attributes.lexicon,256),required=el.attributes.required=='true'})
      active=true
    end
    if el.t=='Div'and(has(el,'learning-journey')or has(el,'learning-preferences')or has(el,'learning-practice')or has(el,'learning-report')or has(el,'learning-sandbox')or has(el,'learning-export'))then panels[#panels+1]=el;active=true end
    if has(el,'learning-variant')then active=true end
    if el.t=='Div'and el.attributes and(el.attributes['learning-role']or el.attributes['data-learning-role'])then roles[#roles+1]=el end
  end
  doc:walk({Div=record,Span=record,Header=record,CodeBlock=record,Code=record,Link=record,Image=record,Table=record,Figure=record})
  if numbasOwned or #translationRows>0 then active=true end
  if not active then return doc end
  if #all>50 or #panels>20 then fail()end
  local function forbid(el)
    pandoc.Inlines({el}):walk({Span=function(child)if has(child,'learning-variant')then fail()end end,
      Div=function(child)if has(child,'learning-variant')then fail()end end})
  end
  local objects=pandoc.List();local selected={};local originals={};local variants={};local publicRoleIndex=0
  for _,panel in ipairs(realisations)do if anchors[panel.id]~=1 then fail()end end
  for _,el in ipairs(all)do
    if el.attributes.review=='author-reviewed'then
      local id=token(el.identifier);if anchors[id]~=1 or selected[id]then fail()end
      if has(el,'controlled-assertion')and(restricted[id]or el.attributes.public~='true')then fail()end
      if nonpublic(el)or el.attributes.hidden~=nil or el.attributes.inert~=nil or el.attributes['aria-hidden']=='true'then fail()end
      el.content:walk({Cite=forbid,Quoted=forbid,Div=function(child)
        if has(child,'adaptive-object')or has(child,'learning-object')or has(child,'reviewed-realisation')or child.attributes.hidden~=nil or child.attributes.inert~=nil or child.attributes['aria-hidden']=='true'then fail()end
        if has(child,'protected-assertion')or has(child,'learning-invariant')then
          child.content:walk({Span=function(v)if has(v,'learning-variant')then fail()end end,Div=function(v)if has(v,'learning-variant')then fail()end end})
        end
      end,Span=function(child)if child.attributes.hidden~=nil or child.attributes.inert~=nil or child.attributes['aria-hidden']=='true'then fail()end end})
      local reviewer=text(el.attributes['reviewed-by']);local objectSource=source(el)
      local item={id=id,revision=text(el.attributes.revision,128),label=text(el.attributes.label),context=text(el.attributes.context,128),
        conceptId=text(el.attributes['concept-id']or el.attributes['semantic-id'],512),reviewedBy=reviewer,
        sourceDigest=digest(el),sourceText=objectSource,assertionId=str(el.attributes['assertion-id']),groups=pandoc.List()}
      local groups={};local count=0
      local function variant(child)
        if not has(child,'learning-variant')then return end
        if nonpublic(child)or has(child,'protected-assertion')or has(child,'learning-invariant')then fail()end
        count=count+1;if count>100 then fail()end
        local group,axis,value=token(child.attributes.group),text(child.attributes.axis,32),token(child.attributes.value)
        if not ({['exposition']=true,['terminology']=true,['scaffolding']=true,['prerequisite-knowledge']=true,['reading-complexity']=true,['context-interest']=true,['representation']=true,['challenge']=true})[axis] then fail() end
        if child.attributes.review~='author-reviewed'then fail()end
        local blocked=false
        local content=child.content
        content:walk({RawBlock=function()blocked=true end,RawInline=function()blocked=true end,
          Div=function(v)if has(v,'learning-variant')or v.attributes.hidden~=nil or v.attributes.inert~=nil or v.attributes['aria-hidden']=='true'then blocked=true end end,
          Span=function(v)if has(v,'learning-variant')or v.attributes.hidden~=nil or v.attributes.inert~=nil or v.attributes['aria-hidden']=='true'then blocked=true end end,
          Math=function()if child.t=='Span'then blocked=true end end,
          Cite=function()if child.t=='Span'then blocked=true end end,
          Quoted=function()if child.t=='Span'then blocked=true end end,
          Code=function()if child.t=='Span'then blocked=true end end})
        if blocked then fail()end
        local anchor=child.identifier
        if anchor==''then anchor=id..'--'..group..'--'..value;if anchors[anchor]then fail()end;anchors[anchor]=1;child.identifier=anchor
        elseif anchors[anchor]~=1 then fail()end
        local bucket=groups[group]
        if not bucket then bucket={id=group,axis=axis,variants=pandoc.List()};groups[group]=bucket;item.groups:insert(bucket)elseif bucket.axis~=axis then fail()end
        local isDefault=child.attributes['default']=='true'
        if isDefault and bucket.defaultValue then fail()end
        if isDefault then bucket.defaultValue=value end
        local v={value=value,anchor=anchor,revision=text(child.attributes.revision,128),sourceDigest=digest(child),review='author-reviewed',reviewedBy=text(child.attributes['reviewed-by'])}
        bucket.variants:insert(v);variants[anchor]=child
        child.attributes['data-gw-object']=id;child.attributes['data-gw-group']=group;child.attributes['data-gw-axis']=axis;child.attributes['data-gw-value']=value
        return child
      end
      el.content=el.content:walk({Div=variant,Span=variant})
      if count>0 and(has(el,'protected-assertion')or has(el,'learning-invariant'))then fail()end
      for _,g in ipairs(item.groups)do if not g.defaultValue then g.defaultValue=g.variants[1].value end end
      if has(el,'controlled-assertion')then
        local row={objectId=id,assertionId=text(el.attributes['assertion-id'],512),assertionRevision=text(el.attributes['assertion-revision']or el.attributes.revision,128),context=item.context,domain=text(el.attributes.domain,128),modality=el.attributes.modality or'asserted',status=el.attributes.status or'claim',assumptions=pandoc.List(),claim=''}
        local found=false
        for _,block in ipairs(el.content)do
          local unsupported=block.t~='Para'and block.t~='Plain'
          local roleSpan=nil
          if not unsupported and #block.content==1 and block.content[1].t=='Span'and has(block.content[1],'scenario-statement')then roleSpan=block.content[1]end
          local check=roleSpan and pandoc.Para(roleSpan.content)or block
          if not unsupported then check:walk({Emph=function()unsupported=true end,Strong=function()unsupported=true end,Math=function()unsupported=true end,Cite=function()unsupported=true end,Quoted=function()unsupported=true end,Code=function()unsupported=true end,RawInline=function()unsupported=true end,Link=function()unsupported=true end,Image=function()unsupported=true end,Span=function()unsupported=true end})end
          if roleSpan and options['scenario-candidates']~=false and(type(options['scenario-candidates'])=='table'or options.catalogue~=nil)then
            local bad=unsupported or scenarioBlocked[id]or excluded(roleSpan)or anchors[roleSpan.identifier]~=1 or not pandoc.utils.stringify(check):match('^Claim:%s*')
            scenarioRows:insert({objectId=id,roleId=str(roleSpan.identifier)or'',scenario=str(roleSpan.attributes.scenario)or'',role=str(roleSpan.attributes['scenario-role'])or'',sourceText=bad and''or source(roleSpan),sourceDigest=bad and('sha1:'..pandoc.utils.sha1(''))or digest(roleSpan),unsupported=bad and'native-role-ineligible'or nil})
            scenarioCaptured[roleSpan.identifier]=true
          end
          if unsupported then row.unsupported='native-controlled-content'else
            local literal=pandoc.utils.stringify(block)
            if literal:match('^Assume:%s*')and not found then row.assumptions:insert((literal:gsub('^Assume:%s*','')))
            elseif literal:match('^Claim:%s*')and not found then row.claim=literal:gsub('^Claim:%s*','');found=true
            else row.unsupported='native-controlled-paragraph'end
          end
        end
        if not found then row.unsupported='native-controlled-claim'end
        controlled:insert(row)
      end
      selected[id]=item;originals[id]=el;objects:insert(item)
    elseif el.attributes.review~='candidate'then fail()end
  end
  -- Every authored role counts, including unreviewed/outside/blocked sources.
  -- Otherwise omitting one clause could silently export an easier problem.
  -- No excluded source text is put into the observation or public packet.
  if options['scenario-candidates']~=false and(type(options['scenario-candidates'])=='table'or options.catalogue~=nil)then
    doc:walk({Span=function(el)if has(el,'scenario-statement')and not scenarioCaptured[el.identifier]then
      local roleId=str(el.identifier)or''
      scenarioRows:insert({objectId='unavailable-'..pandoc.utils.sha1(roleId),roleId=roleId,scenario=str(el.attributes.scenario)or'',role=str(el.attributes['scenario-role'])or'',sourceText='',sourceDigest='sha1:'..pandoc.utils.sha1(''),unsupported='native-role-not-selected'})
    end end})
  end
  if options['wai-adapt']~=false and(type(options['wai-adapt'])=='table'or options.catalogue~=nil)then
    doc:walk({Span=function(el)if has(el,'learning-symbol')then
      local bad=symbolBlocked[el.identifier]or excluded(el)or el.attributes.public~='true'or el.attributes.review~='author-reviewed'or el.attributes['adapt-symbol']~=nil or el.attributes['data-adapt-symbol']~=nil or el.attributes['data-gw-symbol-snapshot']~=nil or anchors[el.identifier]~=1
      for _,inline in ipairs(el.content)do if inline.t~='Str'and inline.t~='Space'then bad=true end end
      symbolRows:insert({id=str(el.identifier)or'',revision=str(el.attributes.revision)or'',concept=str(el.attributes.aac)or'',sourceDigest=bad and('sha1:'..pandoc.utils.sha1(''))or digest(el),sourceText=bad and''or source(el),text=bad and''or pandoc.utils.stringify(el.content),reviewedBy=str(el.attributes['reviewed-by'])or'',unsupported=bad and'native-symbol-ineligible'or nil})
    end end})
  end
  local publicRoles={objective=true,givens=true,explanation=true,qualification=true}
  local function excludedRole(role)
    local kind=role.attributes['learning-role']or role.attributes['data-learning-role']
    return nonpublic(role)or kind=='hint'or kind=='solution'or kind=='answer'or kind=='feedback'or kind=='post-attempt'or has(role,'generative-solution')or has(role,'generative-answer')or has(role,'generative-feedback')or role.attributes.hidden~=nil or role.attributes.inert~=nil or role.attributes['aria-hidden']=='true'
  end
  if options['local-ai-sources']~=false then
    for _,item in ipairs(objects)do local owner=originals[item.id];owner.content=owner.content:walk({traverse='topdown',Div=function(role)
      if excludedRole(role)then return role,false end
      local kind=role.attributes['learning-role']or role.attributes['data-learning-role']
      if publicRoles[kind]then
        local excluded=false
        role.content:walk({Div=function(child)if excludedRole(child)then excluded=true end end,Span=function(child)if excludedRole(child)then excluded=true end end})
        if excluded then return role end
        publicRoleIndex=publicRoleIndex+1
        role.attributes['data-learning-role']=kind
        if role.identifier==''then local id=owner.identifier..'--public-'..publicRoleIndex;if anchors[id]then fail()end;role.identifier=id;anchors[id]=1 end
        if not has(role,'local-ai-source')then role.classes:insert('local-ai-source')end
        role.attributes['data-source-review']='author-reviewed'
        if not role.attributes['data-source-label']then role.attributes['data-source-label']='Authored '..kind end
        return role,false
      end
    end})end
  end
  doc.blocks=doc.blocks:walk({Div=function(el)if originals[el.identifier]then return originals[el.identifier]end end})
  local activityAPI=dofile(pandoc.path.join({runtime,'activity-native.lua'}))
  local activityObservations,activitySources=activityAPI.capture(doc)
  local root,inputDir,page,offset=native_location(native_directory,project_root())
  local html=quarto.doc.is_format('html:js')
  local numbasRunId=numbasAPI.run_id(root)
  local numbasRows=numbasRunId and numbasAPI.capture(doc)or pandoc.List()
  local request={version=1,root=root,inputDir=inputDir,pageURL=page,language=doc.meta.lang and str(doc.meta.lang)or'en',html=html,
    options=options,translationRows=translationRows,numbasRows=numbasRows,numbasRunId=numbasRunId,sourcePath=numbasSource,numbasOutputRoot=(html and numbasRunId and numbasAPI.output_root(root)or nil),objects=objects,controlled=controlled,realisations=realisations,scenarioRows=scenarioRows,symbolRows=symbolRows,activities=activityObservations,activitySources=activitySources,pageSource=pandoc.write(pandoc.Pandoc(doc.blocks),'json')}
  local website=doc.meta.website
  local siteURL=quarto.metadata.get('website.site-url')
  if siteURL~=nil then request.siteURL=str(siteURL)
  elseif website and website['site-url']then request.siteURL=str(website['site-url'])end
  local ok,response=pcall(pandoc.pipe,os.getenv('QUARTO_BIN')or'quarto',{'run',pandoc.path.join({runtime,'compile.ts'})},json(request))
  if not ok then fail()end
  local compiled;ok,compiled=pcall(pandoc.json.decode,response)
  if not ok or type(compiled)~='table'or compiled.version~=1 then fail()end
  local selection={};for _,object in ipairs(compiled.selection and compiled.selection.objects or{})do for _,g in ipairs(object.groups)do selection[g.anchor]=true end end
  if not html then
    doc.blocks=doc.blocks:walk({Div=function(el)if variants[el.identifier]and not selection[el.identifier]then return{}end end,
      Span=function(el)if variants[el.identifier]and not selection[el.identifier]then return{}end end})
  end
  doc=translationAPI.place(doc,compiled.translations,compiled.translationReviewYAML)
  doc=numbasAPI.place(doc,compiled.numbas)
  local appended=pandoc.List()
  local outputs={};for _,result in ipairs(compiled.controlledRealisations or{})do outputs[result.id]=result end
  doc.blocks=doc.blocks:walk({Div=function(el)
    if has(el,'reviewed-realisation')then
      local result=outputs[el.identifier];if not result then fail()end
      if result.status=='available'then
        local real=result.realisation;local body=pandoc.List({pandoc.Para({pandoc.Str(real.qualification)})})
        for line in (real.text..'\n'):gmatch('(.-)\n')do if line~=''then body:insert(pandoc.Para({pandoc.Str(line)}))end end
        el.content=body;el.attributes.lang=real.language
      else el.content:insert(pandoc.Para({pandoc.Str(result.notice)}))end
      return el
    end
  end})
  if type(compiled.controlledInspection)=='table' then
    local body=pandoc.List({pandoc.Header(2,'Controlled authoring: current review bindings'),pandoc.Para({pandoc.Str(compiled.controlledInspection.notice)})})
    if type(compiled.controlledInspection.reason)=='string' then body:insert(pandoc.Para({pandoc.Str('Unavailable controlled form: '..compiled.controlledInspection.reason)}))end
    if type(compiled.controlledReviewYAML)=='string' then body:insert(pandoc.Para({pandoc.Str('Inspect the original source and typed structure. After review, copy this YAML map into the existing generative-websites configuration, retaining its other options.')}));body:insert(pandoc.CodeBlock(compiled.controlledReviewYAML,pandoc.Attr('',{'yaml'})))end
    appended:insert(pandoc.Div(body,pandoc.Attr('',{'generative-controlled-inspection'})))
  end
  for _,entry in ipairs(type(compiled.scenarioCandidates)=='table'and compiled.scenarioCandidates.results or{})do
    local body=pandoc.List({pandoc.Header(2,'Scenario candidate: '..entry.scenario.label),pandoc.Para({pandoc.Str(entry.notice)}),pandoc.Para({pandoc.Str('Status: '..entry.status..(type(entry.reason)=='string'and(' ('..entry.reason..')')or''))}),pandoc.CodeBlock(json(entry),pandoc.Attr('',{'json'}))})
    appended:insert(pandoc.Div(body,pandoc.Attr('',{'generative-scenario-inspection'})))
  end
  if type(compiled.scenarioReviewYAML)=='string'then appended:insert(pandoc.CodeBlock(compiled.scenarioReviewYAML,pandoc.Attr('',{'yaml'})))end
  if type(compiled.waiSymbols)=='table'then
    local packet=compiled.waiSymbols
    local chosen={};for _,a in ipairs(packet.annotations or{})do chosen[a.id]=a end
    doc.blocks=doc.blocks:walk({Span=function(el)local a=chosen[el.identifier];if a then
      el.attributes['adapt-symbol']=a.concept;el.attributes['data-gw-symbol-snapshot']=packet.snapshotSha256
      if html then
        -- Pandoc treats an unrecognised Span attribute as data-*. Preserve its
        -- own escaping/attributes/text and promote only this reviewed numeric
        -- attribute on this single admitted opening span, never page HTML.
        local rendered=pandoc.write(pandoc.Pandoc({pandoc.Plain({el})}),'html5',{wrap_text='none'})
        local finish=rendered:find('>',1,true)
        if not finish or not rendered:match('^<span%s')then fail()end
        local opening,count=rendered:sub(1,finish):gsub('(%s)data%-adapt%-symbol="'..a.concept..'"','%1adapt-symbol="'..a.concept..'"')
        if count~=1 then fail()end
        return pandoc.RawInline('html',opening..rendered:sub(finish+1))
      end
      return el
    end end})
    for _,path in ipairs(compiled.waiResources or{})do quarto.doc.add_resource(path)end
    appended:insert(pandoc.Div({pandoc.Header(2,'WAI-Adapt project symbol pilot'),pandoc.Para({pandoc.Str(packet.inspection.notice)}),pandoc.CodeBlock(compiled.waiReviewYAML,pandoc.Attr('',{'yaml'}))},pandoc.Attr('',{'generative-symbol-inspection'})))
  end
  for _,report in ipairs(compiled.reports or{})do
    if anchors[report.id]then fail()end;anchors[report.id]=1
    local body=pandoc.List({pandoc.Header(2,report.title),pandoc.Para({pandoc.Str(report.notice)})})
    body:insert(pandoc.Para({pandoc.Str('Review fingerprint: '),pandoc.Code(report.sourceDigest)}))
    local targets={};for _,target in ipairs(report.linkTargets or{})do targets[target.id]=target end
    local function sourceLink(label,s)return pandoc.Link({pandoc.Str(label)},offset..s.path:gsub('^/','')..'#'..s.anchor)end
    for _,row in ipairs(report.records)do
      body:insert(pandoc.Para({pandoc.Strong({pandoc.Str(row.kindLabel..': ')}),pandoc.Str(row.label..' — '..row.occurredOn..(row.text and('. '..row.text)or'')),pandoc.Str(row.qualification and(' Qualification: '..row.qualification)or'')}))
      local links=pandoc.List({sourceLink('Source',row.source)})
      for _,link in ipairs(row.links or{})do local target=targets[link.target];if target then links:insert(pandoc.Space());links:insert(sourceLink(link.relation..': '..target.label,target.source))end end
      if row.supersedes and targets[row.supersedes]then links:insert(pandoc.Space());links:insert(sourceLink('Correction of '..targets[row.supersedes].label,targets[row.supersedes].source))end
      body:insert(pandoc.Para(links))
    end
    appended:insert(pandoc.Div(body,pandoc.Attr(report.id,{'generative-period-report'})))
  end
  local exercisePanels={}
  for _,exercise in ipairs(compiled.exercises or{})do
    if anchors[exercise.spec.id]then fail()end;anchors[exercise.spec.id]=1
    local body=pandoc.List({pandoc.Header(2,exercise.spec.label or exercise.spec.id),pandoc.Div({pandoc.Para({pandoc.Str(exercise.problem.prompt)})},pandoc.Attr('',{'generative-exercise-task'})),
      pandoc.Para({pandoc.Str('Algorithmic practice; checking a response does not establish mastery or theorem verification.')})})
    exercisePanels[exercise.spec.id]=pandoc.Div(body,pandoc.Attr(exercise.spec.id,{'generative-exercise'}))
  end
  local activityExercises
  doc,activityExercises=activityAPI.place(doc,compiled.activities,exercisePanels)
  for _,exercise in ipairs(compiled.exercises or{})do if not activityExercises[exercise.spec.id]then appended:insert(exercisePanels[exercise.spec.id])end end
  for _,block in ipairs(appended)do doc.blocks:insert(block)end
  if html then
    local function payload(class,value)if value~=nil then doc.blocks:insert(pandoc.RawBlock('html','<script type="application/json" class="'..class..'">'..escaped(value)..'</script>'))end end
    doc=numbasAPI.packet(doc,compiled.numbas)
    payload('generative-public-data',compiled.publicPage)
    payload('generative-publication-data',{version=1,root=offset,defaults=compiled.defaults,publication=compiled.publication,offline=compiled.offline})
    payload('generative-exercises-data',compiled.exercises)
    if type(compiled.activities)=='table' then payload('generative-activities-data',compiled.activities)end
    payload('generative-reports-data',compiled.reports)
    payload('generative-assertion-identities-data',compiled.assertionIdentities)
    if type(compiled.controlledInspection)=='table' then payload('generative-controlled-inspection-data',compiled.controlledInspection)end
    if type(compiled.controlledRealisations)=='table' and #compiled.controlledRealisations>0 then payload('generative-controlled-realisations-data',compiled.controlledRealisations)end
    payload('generative-sandbox-data',compiled.sandbox)
    if type(compiled.scenarioCandidates)=='table'then payload('generative-scenario-candidates-data',compiled.scenarioCandidates)end
    if type(compiled.waiSymbols)=='table'then payload('generative-wai-symbols-data',compiled.waiSymbols)end
    payload('generative-sandbox-session-mappings-data',compiled.sandboxSessionMappings)
    payload('generative-oer-data',compiled.oer)
    local head=''
    local function attribute(s)return s:gsub('&','&amp;'):gsub('"','&quot;'):gsub('<','&lt;'):gsub('>','&gt;')end
    if type(compiled.languageLinks)=='table' then
      local links=pandoc.List()
      for _,link in ipairs(compiled.languageLinks.alternates)do
        head=head..'<link rel="alternate" hreflang="'..attribute(link.language)..'" href="'..attribute(link.href)..'">\n'
        links:insert(pandoc.Link({pandoc.Str(link.language)},link.href))
        links:insert(pandoc.Space())
      end
      if type(compiled.languageLinks.canonical)=='table'and compiled.languageLinks.canonical.absolute then head=head..'<link rel="canonical" href="'..attribute(compiled.languageLinks.canonical.href)..'">\n'end
      doc.blocks:insert(pandoc.Div({pandoc.Para({pandoc.Str('Authored language pages: ')}),pandoc.Para(links)},pandoc.Attr('',{'generative-language-links'})))
    end
    local workers=nil
    if compiled.offline and compiled.offline.enabled then workers={{source='gw-offline-worker.js',destination=quarto.project.directory and'/gw-offline-worker.js'or'gw-offline-worker.js'}}end
    if head~=''then quarto.doc.include_text('in-header',head)end
    quarto.doc.add_html_dependency({name='generative-websites-features',version='0.0.13',scripts={{path='features-browser.js',attribs={type='module'}}},stylesheets={'features.css'},serviceworkers=workers})
  end
  return doc
end
return M
