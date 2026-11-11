-- Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
-- Explicit ordinary QMD source/candidate collection. No inference or rewriting.
local M={}
local function fail()assert(false,'generative-websites: translation source/candidate is unsupported, private, ambiguous or stale; inspect current QMD and review pins')end
local function has(el,c)return el.classes and el.classes:includes(c)end
local function role(el)if has(el,'translation-source')then return'source'elseif has(el,'translation-candidate')then return'candidate'end end
local function text(v,max)if type(v)~='string'or v==''or #v>(max or 256)or v:find('[%z\1-\31\127]')then fail()end;return v end
local function id(v)v=text(v,128);if not v:match('^[A-Za-z][A-Za-z0-9._:%-]*$')or v=='constructor'or v=='prototype'then fail()end;return v end
local function excluded(el)local a=el.attributes or{};for k in pairs(a)do if k:match('^when%-')or k:match('^unless%-')then return true end end;return a.public=='false'or a.consent=='false'or a.visibility=='private'or a.audience=='private'or a.hidden~=nil or a.inert~=nil or a['aria-hidden']=='true'or has(el,'private')or has(el,'content-hidden')or has(el,'content-visible')or has(el,'hidden')end
function M.capture(doc,config)
 if config==false then return pandoc.List()end
 local rows=pandoc.List();local banned={};local anchors={}
 local function guard(el)if excluded(el)then if role(el)then banned[el.identifier]=true end;el:walk({Div=function(v)if role(v)then banned[v.identifier]=true end end});return el,false end end
 doc:walk({traverse='topdown',Div=guard,Span=guard})
 local function anchor(el)if el.identifier and el.identifier~=''then anchors[el.identifier]=(anchors[el.identifier]or 0)+1 end end
 doc:walk({Div=anchor,Span=anchor,Header=anchor,CodeBlock=anchor,Code=anchor,Link=anchor,Image=anchor,Table=anchor,Figure=anchor})
 doc:walk({Div=function(el)local r=role(el);if not r then return end
  if banned[el.identifier]or excluded(el)or el.attributes.public~='true'or anchors[el.identifier]~=1 then fail()end
  local nested=false;el.content:walk({Div=function(v)if role(v)then nested=true end end});if nested then fail()end
  local projection=pandoc.write(pandoc.Pandoc(el.content),'json');if #projection>262144 then fail()end
  local row={role=r,id=id(el.identifier),revision=text(el.attributes.revision,128),language=text(el.attributes.lang or pandoc.utils.stringify(doc.meta.lang or'en'),64),semanticId=text(el.attributes['semantic-id'],512),sourceDigest='sha1:'..pandoc.utils.sha1(projection),projection=pandoc.json.decode(projection)}
  if r=='candidate'then row.source=id(el.attributes.source)end
  rows:insert(row);if #rows>32 then fail()end
 end})
 return rows
end
function M.place(doc,packet,reviewYAML)
 if type(packet)~='table'then return doc end
 local sources={};for _,source in ipairs(packet.sources or{})do sources[source.source.id]=source end
 local existing={};local anchorCounts={};local function anchor(el)if el.identifier and el.identifier~=''then existing[el.identifier]=el;anchorCounts[el.identifier]=(anchorCounts[el.identifier]or 0)+1 end end
 doc:walk({Div=anchor,Span=anchor,Header=anchor,CodeBlock=anchor,Code=anchor,Link=anchor,Image=anchor,Table=anchor,Figure=anchor})
 local appended=pandoc.List()
 for _,result in ipairs(packet.results or{})do
  local candidate=result.candidate;local target=existing[result.id];local notice=pandoc.Para({pandoc.Str('Translation status: '..result.status..'. '..packet.qualification)})
  if target then if anchorCounts[result.id]~=1 or not has(target,'translation-candidate')then fail()end;doc.blocks=doc.blocks:walk({Div=function(el)if el.identifier==result.id then el.content:insert(notice);el.attributes.lang=candidate.target.language;return el end end})
  else
   local ok,parsed=pcall(pandoc.read,pandoc.json.encode(candidate.projection),'json');if not ok then fail()end
   local body=pandoc.List({pandoc.Header(2,'Translation candidate ('..candidate.target.language..')'),notice});for _,b in ipairs(parsed.blocks)do body:insert(b)end
   target=pandoc.Div(body,pandoc.Attr(result.id,{'translation-candidate'},{lang=candidate.target.language}));appended:insert(target)
  end
  local body=pandoc.List({pandoc.Header(2,'Review translation: '..result.id),pandoc.Para({pandoc.Link({pandoc.Str('Original source')},'#'..result.sourceId),pandoc.Space(),pandoc.Link({pandoc.Str('Candidate wording')},'#'..result.id)}),notice})
  if type(result.review)=='table' then
   body:insert(pandoc.Para({pandoc.Str('Review declared on '..result.review.reviewedOn..'. Candidate snapshot '),pandoc.Code(result.snapshotSha256)}))
  else
   body:insert(pandoc.Para({pandoc.Str('Candidate awaiting review. Candidate snapshot '),pandoc.Code(result.snapshotSha256)}))
  end
  body:insert(pandoc.Para({pandoc.Str('Compare meaning, assumptions, uncertainty, negation, scope and terminology in both languages. Exact protected objects, structure and numbers have been checked; ordinary prose equivalence has not.')}))
  for i,source in ipairs(candidate.sourceSegments)do local translated=candidate.targetSegments[i];body:insert(pandoc.Para({pandoc.Strong({pandoc.Str('Original '..source.id..': ')}),pandoc.Str(source.text)}));body:insert(pandoc.Para({pandoc.Strong({pandoc.Str('Candidate '..translated.id..': ')}),pandoc.Str(translated.text)}))end
  body:insert(pandoc.Para({pandoc.Str('Candidate JSON for explicit import, retaining the exact original source binding:')}));body:insert(pandoc.CodeBlock(pandoc.json.encode(candidate),pandoc.Attr('',{'json'})))
  appended:insert(pandoc.Div(body,pandoc.Attr('',{'generative-translation-inspection'})))
 end
 for _,problem in ipairs(packet.problems or{})do appended:insert(pandoc.Div({pandoc.Header(2,'Translation unavailable: '..problem.id),pandoc.Para({pandoc.Str(problem.reason..'. '..problem.qualification)})},pandoc.Attr('',{'generative-translation-inspection'})))end
 for _,source in ipairs(packet.sources or{})do appended:insert(pandoc.Div({pandoc.Header(2,'Translation source packet: '..source.source.id),pandoc.Para({pandoc.Str('Copy this JSON to a private source-packet.json only when explicitly requesting a local candidate. Render and Preview never invoke a model.')}),pandoc.CodeBlock(pandoc.json.encode(source),pandoc.Attr('',{'json'}))},pandoc.Attr('',{'generative-translation-source-packet'})))end
 if type(reviewYAML)=='string'then appended:insert(pandoc.Para({pandoc.Str('These candidate fingerprints are available for projects using explicit reviewed translation configuration. Compare the full original and target wording in this output.')}));appended:insert(pandoc.CodeBlock(reviewYAML,pandoc.Attr('',{'yaml'})))end
 for _,b in ipairs(appended)do doc.blocks:insert(b)end
 return doc
end
return M
