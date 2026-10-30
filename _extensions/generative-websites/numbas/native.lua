-- Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
-- Original current-AST observations and native inspection transport only.
local M={}
local function fail()assert(false,'generative-websites: Numbas requires an ordinary public unique native placeholder, current project render and matching source review')end
local function has(el,c)return el.classes and el.classes:includes(c)end
local function excluded(el)
  local a=el.attributes or{};if a.public=='false'or a.consent=='false'or a.visibility=='private'or a.audience=='private'or a.hidden~=nil or a.inert~=nil or a['aria-hidden']=='true'then return true end
  for _,c in ipairs(el.classes or{})do if c=='private'or c=='hidden'or c=='content-hidden'or c:match('^content%-')then return true end end
  return false
end
local function read(path,max)
 local f=io.open(path,'rb');if not f then return nil end;local data=f:read(max+1);f:close();if not data or#data>max then fail()end;local ok,value=pcall(pandoc.json.decode,data);if not ok or type(value)~='table'then fail()end;return value
end
function M.context(cwd,root)
 local input=quarto.doc.input_file;if not pandoc.path.is_absolute(input)then input=pandoc.path.join({cwd,input})end;input=pandoc.path.normalize(input)
 local path=pandoc.path.make_relative(input,root,true):gsub('\\','/');if path=='..'or path:match('^%.%./')or pandoc.path.is_absolute(path)then fail()end
 return path
end
-- Quarto 1.11.5 can damage the same absolute Latin-1 project prefix in
-- both APIs. Recover only their actual relative output suffix, then anchor it
-- to the captured native UTF-8 root; the compiler also matches the hook value.
function M.output_root(root)
 local output=quarto.project.output_directory;local reported=quarto.project.directory
 if type(output)~='string'or output==''then fail()end
 local suffix=output
 if pandoc.path.is_absolute(output)then if type(reported)~='string'or reported==''then fail()end;suffix=pandoc.path.make_relative(output,reported,true)end
 suffix=pandoc.path.normalize(suffix):gsub('\\','/')
 if suffix=='.'or suffix=='..'or suffix:match('^%.%./')or pandoc.path.is_absolute(suffix)or suffix:find(utf8.char(0xFFFD),1,true)then fail()end
 return pandoc.path.normalize(pandoc.path.join({root,suffix}))
end
function M.has_owned(root,path)
 local record=read(pandoc.path.join({root,'.quarto','generative-websites','numbas','publication.json'}),4194304);if not record then return false end
 if record.version~=1 or type(record.pages)~='table'then fail()end;for _,page in ipairs(record.pages)do if type(page.packages)=='table'and#page.packages>0 then return true end end;return false
end
function M.run_id(root)
 local record=read(pandoc.path.join({root,'.quarto','generative-websites','numbas','active.json'}),2048);if not record then return nil end
 if record.version~=1 or type(record.runId)~='string'or#record.runId~=36 or not record.runId:match('^[a-f0-9%-]+$')then fail()end;return record.runId
end
function M.capture(doc)
 local counts,blocked,rows={}, {},pandoc.List()
 local function count(el)if type(el.identifier)=='string'and el.identifier~=''then counts[el.identifier]=(counts[el.identifier]or 0)+1 end end
 doc:walk({Div=count,Span=count,Header=count,CodeBlock=count,Code=count,Link=count,Image=count,Table=count,Figure=count})
 local function block(el)
  if type(el.identifier)=='string'and has(el,'learning-numbas')then blocked[el.identifier]=true end
  el:walk({Div=function(child)if has(child,'learning-numbas')then blocked[child.identifier]=true end end});return el,false
 end
 doc:walk({traverse='topdown',Div=function(el)if excluded(el)then return block(el)end end,Span=function(el)if excluded(el)then return block(el)end end,BlockQuote=block})
 doc:walk({Div=function(el)if has(el,'learning-numbas')then
   if not el.identifier or el.identifier==''or counts[el.identifier]~=1 or blocked[el.identifier]then return end
   local invalid=false;el:walk({Div=function(child)if child.identifier~=el.identifier and(has(child,'learning-numbas')or excluded(child))then invalid=true end end,Span=function(child)if excluded(child)then invalid=true end end});if invalid then return end
   rows:insert({id=el.identifier,sourceDigest='sha1:'..pandoc.utils.sha1(pandoc.write(pandoc.Pandoc(el.content),'json'))})
  end end,RawBlock=function(el)if el.text:find('generative%-numbas%-data')then fail()end end,RawInline=function(el)if el.text:find('generative%-numbas%-data')then fail()end end})
 return rows
end
local function escaped(value)return pandoc.json.encode(value):gsub('<','\\u003c'):gsub('>','\\u003e'):gsub('&','\\u0026'):gsub(utf8.char(0x2028),'\\u2028'):gsub(utf8.char(0x2029),'\\u2029')end
function M.packet(doc,result)
 if type(result)=='table'and result.status=='staged'then
  local packet={version=1,runId=result.runId,pageSourceSha256=result.pageSourceSha256,payloads=result.payloads}
  doc.blocks:insert(pandoc.RawBlock('html','<script type="application/json" class="generative-numbas-data">'..escaped(packet)..'</script>'))
 end;return doc
end
function M.place(doc,result)
 if type(result)~='table'or type(result.inspections)~='table'then return doc end
 local byid={};for _,entry in ipairs(result.inspections)do byid[entry.id]=entry end
 doc.blocks=doc.blocks:walk({Div=function(el)local entry=byid[el.identifier];if entry and has(el,'learning-numbas')then
   el.content:insert(pandoc.Para({pandoc.Str('Optional Numbas activity: '..entry.label..'. '..entry.notice)}))
   if entry.status~='reviewed'then el.content:insert(pandoc.Para({pandoc.Str('Inspect the local question, runtime and notices. After actual review, copy this generated review map under this activity in YAML and replace its reviewer/date placeholders.')}));if type(entry.reviewYAML)=='string'then el.content:insert(pandoc.CodeBlock(entry.reviewYAML,pandoc.Attr('',{'yaml'})))end end
   return el
  end end});return doc
end
function M.disabled(doc,runtime,cwd,root)
 if not quarto.doc.is_format('html:js')then return doc end;local path=M.context(cwd,root);if not M.has_owned(root,path)then return doc end
 local input=quarto.doc.input_file;if not pandoc.path.is_absolute(input)then input=pandoc.path.join({cwd,input})end
 local output=quarto.doc.output_file;local parent=pandoc.path.make_relative(pandoc.path.directory(input),root,true):gsub('\\','/');local page=(parent=='.'and''or parent..'/')..pandoc.path.filename(output)
 local request={outputRoot=M.output_root(root),root=root,inputDir=pandoc.path.directory(input),sourcePath=path,pageURL=page,html=true,pageSource=pandoc.write(pandoc.Pandoc(doc.blocks),'json'),activities=false,observations=pandoc.List(),runId=M.run_id(root)}
 local ok,response=pcall(pandoc.pipe,os.getenv('QUARTO_BIN')or'quarto',{'run',pandoc.path.join({runtime,'numbas','native-bridge.ts'})},pandoc.json.encode(request));if not ok then fail()end
 local result;ok,result=pcall(pandoc.json.decode,response);if not ok or type(result)~='table'then fail()end;return M.packet(doc,result)
end
return M
