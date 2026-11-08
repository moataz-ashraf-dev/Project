from pathlib import Path
import re, html, json
root=Path('/mnt/data/sq_work/v9')
out=root/'public/pets/generated'; out.mkdir(parents=True,exist_ok=True)

pets=[
('sparky','Sparky','Common',0,'#66e7ff','#b9f5ff','crystal'),
('velvet-cat','Velvet Cat','Common',320,'#b58cff','#f0d9ff','cat'),
('moon-rabbit','Moon Rabbit','Common',360,'#8ee7ff','#e7fbff','rabbit'),
('ember-pup','Ember Pup','Common',400,'#ff8b5c','#ffd2a8','dog'),
('pearl-hamster','Pearl Hamster','Common',440,'#ffc4e1','#fff0f8','hamster'),
('suncrest-parrot','Suncrest Parrot','Common',480,'#55d9c1','#fff17b','parrot'),
('ice-penguin','Ice Penguin','Common',520,'#75cfff','#e8f8ff','penguin'),
('sage-turtle','Sage Turtle','Common',560,'#63d6a1','#c7ffe9','turtle'),
('cobalt-donkey','Cobalt Donkey','Common',600,'#739cff','#d8e4ff','donkey'),
('aurora-fox','Aurora Fox','Rare',900,'#65e5ff','#e8b6ff','fox'),
('river-otter','River Otter','Rare',980,'#55c7e8','#b7f5ff','otter'),
('ruby-red-panda','Ruby Red Panda','Rare',1080,'#ff7f73','#ffd0a5','redpanda'),
('mist-raccoon','Mist Raccoon','Rare',1160,'#9aa7ff','#d9dcff','raccoon'),
('willow-deer','Willow Deer','Rare',1260,'#77dba4','#e3ffca','deer'),
('coral-seal','Coral Seal','Rare',1380,'#ff8da9','#ffd4e2','seal'),
('crystal-owl','Crystal Owl','Rare',1500,'#9a8cff','#dcd7ff','owl'),
('golden-capybara','Golden Capybara','Rare',1700,'#e9b95c','#fff0ae','capybara'),
('shadow-wolf','Shadow Wolf','Epic',28,'#6d72ff','#c0bfff','wolf'),
('snow-leopard','Snow Leopard','Epic',34,'#8bdfff','#ffffff','leopard'),
('storm-eagle','Storm Eagle','Epic',39,'#6b9fff','#c9e3ff','eagle'),
('solar-tiger','Solar Tiger','Epic',45,'#ffb74d','#fff0a8','tiger'),
('royal-lion','Royal Lion','Epic',50,'#e9b24e','#ffe9a6','lion'),
('jade-crocodile','Jade Crocodile','Epic',56,'#54d7a0','#c9ffe6','crocodile'),
('abyss-shark','Abyss Shark','Epic',62,'#5dbbff','#bdeaff','shark'),
('twilight-manta','Twilight Manta','Epic',68,'#a17cff','#e0c9ff','manta'),
('jade-griffin','Jade Griffin','Legendary',92,'#50dfa1','#c8ffe5','griffin'),
('crimson-kitsune','Crimson Kitsune','Legendary',108,'#ff667e','#ffd0d9','kitsune'),
('starlight-unicorn','Starlight Unicorn','Legendary',124,'#e28cff','#ffe0ff','unicorn'),
('sky-pegasus','Sky Pegasus','Legendary',140,'#65cfff','#e8f9ff','pegasus'),
('eternal-phoenix','Eternal Phoenix','Legendary',158,'#ff7b42','#ffd36a','phoenix'),
('storm-wyvern','Storm Wyvern','Legendary',176,'#6e91ff','#d4ddff','wyvern'),
('frost-dragon','Frost Dragon','Legendary',195,'#4bdcff','#d6fbff','dragon'),
('crystal-dragon','Crystal Dragon','Legendary',215,'#a57cff','#e9d9ff','crystal-dragon'),
('void-dragon','Void Dragon','Mythic',240,'#705cff','#d0baff','void-dragon'),
('celestial-whale','Celestial Whale','Mythic',275,'#63bfff','#d8f7ff','whale'),
('starfall-leviathan','Starfall Leviathan','Mythic',320,'#6f8cff','#f0c7ff','leviathan'),
('celestial-seraph','Celestial Seraph','Mythic',370,'#f0cf67','#fff4c2','seraph'),
('dreamweaver-kirin','Dreamweaver Kirin','Mythic',420,'#ef82e9','#c7f7ff','kirin'),
('cosmic-serpent','Cosmic Serpent','Mythic',470,'#8c72ff','#69e7ff','serpent'),
('chrono-dragon','Chrono Dragon','Mythic',520,'#64e8ff','#ffe17b','chrono-dragon'),
]

# base artwork helpers

def svg(p):
    id,name,rarity,price,a,b,kind=p
    # varied backgrounds, framed like premium cards
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 420" role="img" aria-label="{html.escape(name)}">
<defs>
 <radialGradient id="bg"><stop stop-color="{a}" stop-opacity=".30"/><stop offset=".62" stop-color="#102a4a" stop-opacity=".42"/><stop offset="1" stop-color="#030916" stop-opacity=".98"/></radialGradient>
 <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>
 <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity=".30"/><stop offset="1" stop-color="#081426" stop-opacity=".32"/></linearGradient>
 <filter id="glow"><feGaussianBlur stdDeviation="7" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
</defs>
<rect width="480" height="420" rx="36" fill="#050c19"/><rect x="8" y="8" width="464" height="404" rx="30" fill="url(#bg)" stroke="{a}" stroke-opacity=".42" stroke-width="2"/>
<circle cx="90" cy="80" r="70" fill="{a}" opacity=".08" filter="url(#soft)"/><circle cx="395" cy="155" r="95" fill="{b}" opacity=".08" filter="url(#soft)"/>
<g stroke="#dff8ff" stroke-opacity=".75" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)">
{creature(kind,a,b)}
</g>
<g fill="#fff"><circle cx="72" cy="55" r="2" opacity=".65"/><circle cx="405" cy="72" r="2" opacity=".8"/><circle cx="370" cy="300" r="1.8" opacity=".55"/><circle cx="112" cy="285" r="1.5" opacity=".55"/></g>
<path d="M54 365H426" stroke="{a}" stroke-opacity=".25"/><text x="240" y="395" text-anchor="middle" fill="#edf9ff" font-family="system-ui,Segoe UI,sans-serif" font-size="21" font-weight="800">{html.escape(name)}</text>
</svg>'''

def creature(k,a,b):
    common='''<ellipse cx="240" cy="292" rx="92" ry="20" fill="#000" opacity=".20" stroke="none"/>'''
    eye='''<circle cx="208" cy="206" r="11" fill="#fff" stroke="none"/><circle cx="272" cy="206" r="11" fill="#fff" stroke="none"/><circle cx="210" cy="207" r="5" fill="#09111f" stroke="none"/><circle cx="270" cy="207" r="5" fill="#09111f" stroke="none"/>'''
    shapes={
'crystal':f'''<path fill="url(#body)" d="M155 282Q154 190 207 163L240 180L273 163Q326 190 325 282Q292 328 240 332Q188 328 155 282Z"/><path fill="{b}" d="M184 181L240 105L296 181L270 176L240 140L210 176Z"/>{eye}<path d="M219 245Q240 259 261 245" fill="none"/>''',
'cat':f'''<path fill="url(#body)" d="M158 285Q155 205 178 184L172 128L217 158Q240 150 263 158L308 128L302 184Q325 205 322 285Q286 329 240 329Q194 329 158 285Z"/><path d="M178 184L196 220M302 184L284 220" fill="none"/>{eye}<path d="M228 238Q240 248 252 238M240 248V263" fill="none"/>''',
'rabbit':f'''<path fill="url(#body)" d="M164 288Q157 210 191 184L184 96Q186 73 202 92L226 166Q240 161 254 166L278 92Q294 73 296 96L289 184Q323 210 316 288Q286 329 240 330Q194 329 164 288Z"/>{eye}<path d="M224 243Q240 252 256 243M240 252V267" fill="none"/>''',
'dog':f'''<path fill="url(#body)" d="M155 286Q153 211 184 181L160 132L213 158Q240 150 267 158L320 132L296 181Q327 211 325 286Q288 330 240 330Q192 330 155 286Z"/>{eye}<path d="M222 244Q240 257 258 244M240 257V270" fill="none"/>''',
'hamster':f'''<ellipse cx="240" cy="250" rx="94" ry="82" fill="url(#body)"/><circle cx="181" cy="249" r="30" fill="{b}" opacity=".45"/><circle cx="299" cy="249" r="30" fill="{b}" opacity=".45"/>{eye}<path d="M225 252Q240 264 255 252M240 264V276" fill="none"/><path d="M184 287Q196 307 216 314M296 287Q284 307 264 314" fill="none"/>''',
'parrot':f'''<path fill="url(#body)" d="M191 300Q153 260 174 205Q191 159 242 166Q292 170 308 222Q318 264 279 304L241 326Z"/><path fill="{b}" d="M247 178Q301 177 334 213L286 238L252 226Z"/><path d="M201 291L160 335L215 309M216 175L186 139" fill="none"/>{eye}<path d="M286 216L329 225L289 239Z" fill="{b}"/>''',
'penguin':f'''<ellipse cx="240" cy="248" rx="78" ry="98" fill="url(#body)"/><ellipse cx="240" cy="266" rx="48" ry="64" fill="#f3fbff" opacity=".88" stroke="none"/><path d="M168 236L122 270L170 278M312 236L358 270L310 278" fill="{a}"/>{eye}<path d="M230 238L240 248L250 238L240 258Z" fill="#ffb95c"/>''',
'turtle':f'''<ellipse cx="240" cy="248" rx="102" ry="72" fill="url(#body)"/><path d="M177 214L140 180L157 250L136 310L184 282M303 214L340 180L323 250L344 310L296 282" fill="{a}"/><circle cx="350" cy="244" r="28" fill="{b}"/>{eye}<path d="M176 248H304M205 192V304M275 192V304" fill="none" opacity=".55"/>''',
'donkey':f'''<path fill="url(#body)" d="M163 291Q158 222 184 186L166 105L216 157Q240 148 264 157L314 105L296 186Q322 222 317 291Q284 327 240 330Q196 327 163 291Z"/>{eye}<path d="M222 245Q240 256 258 245M240 256V270" fill="none"/>''',
'fox':f'''<path fill="url(#body)" d="M156 286Q155 210 184 180L170 118L220 156Q240 149 260 156L310 118L296 180Q325 210 324 286Q287 329 240 331Q193 329 156 286Z"/>{eye}<path d="M224 244Q240 256 256 244M240 256V270" fill="none"/>''',
'otter':f'''<ellipse cx="240" cy="250" rx="75" ry="98" fill="url(#body)"/><path d="M184 214Q148 226 160 260M296 214Q332 226 320 260M210 323L190 352M270 323L290 352" fill="none"/>{eye}<path d="M226 249Q240 259 254 249" fill="none"/>''',
'redpanda':f'''<path fill="url(#body)" d="M154 286Q154 212 180 181L168 130L216 159Q240 150 264 159L312 130L300 181Q326 212 326 286Q288 330 240 330Q192 330 154 286Z"/>{eye}<path d="M192 227L216 236M288 227L264 236M228 253Q240 262 252 253" fill="none"/>''',
'raccoon':f'''<path fill="url(#body)" d="M158 286Q157 209 186 181L174 123L218 158Q240 150 262 158L306 123L294 181Q323 209 322 286Q287 330 240 330Q193 330 158 286Z"/><path d="M177 201Q240 175 303 201L289 232Q240 212 191 232Z" fill="#1d2a43"/>{eye}<path d="M226 248Q240 259 254 248" fill="none"/>''',
'deer':f'''<path fill="url(#body)" d="M172 296Q166 219 196 183L184 133M284 296Q290 219 260 183L272 133" fill="none"/><path fill="url(#body)" d="M184 285Q182 207 240 174Q298 207 296 285Q270 327 240 330Q210 327 184 285Z"/><path d="M200 142L178 112M201 143L217 108M280 142L302 112M279 143L263 108" fill="none"/>{eye}<path d="M226 249Q240 259 254 249" fill="none"/>''',
'seal':f'''<ellipse cx="240" cy="264" rx="104" ry="65" fill="url(#body)"/><circle cx="240" cy="203" r="61" fill="url(#body)"/><path d="M168 274L120 310L175 302M312 274L360 310L305 302" fill="{a}"/>{eye}<path d="M228 245Q240 255 252 245" fill="none"/>''',
'owl':f'''<path fill="url(#body)" d="M160 288Q157 200 204 165Q240 142 276 165Q323 200 320 288Q284 330 240 330Q196 330 160 288Z"/><path d="M164 205L118 172L139 240M316 205L362 172L341 240" fill="{b}"/>{eye}<path d="M240 220L220 245L240 268L260 245Z" fill="{b}"/>''',
'capybara':f'''<ellipse cx="240" cy="260" rx="108" ry="70" fill="url(#body)"/><path d="M168 242L142 204L187 214M312 242L338 204L293 214" fill="{a}"/>{eye}<path d="M228 254Q240 264 252 254" fill="none"/>''',
'wolf':f'''<path fill="url(#body)" d="M153 286Q153 207 184 176L169 105L220 155Q240 148 260 155L311 105L296 176Q327 207 327 286Q287 331 240 331Q193 331 153 286Z"/>{eye}<path d="M224 246Q240 259 256 246M240 258V272" fill="none"/>''',
'leopard':f'''<path fill="url(#body)" d="M158 286Q156 208 185 180L174 116L218 157Q240 150 262 157L306 116L295 180Q324 208 322 286Q286 330 240 330Q194 330 158 286Z"/>{eye}<circle cx="190" cy="270" r="5" fill="{a}"/><circle cx="290" cy="270" r="5" fill="{a}"/><circle cx="201" cy="290" r="4" fill="{a}"/><circle cx="279" cy="290" r="4" fill="{a}"/>''',
'eagle':f'''<path fill="url(#body)" d="M240 320Q201 281 204 218Q208 165 240 148Q272 165 276 218Q279 281 240 320Z"/><path d="M208 208L112 168L170 258M272 208L368 168L310 258" fill="{b}"/><path d="M240 156L226 220L254 220Z" fill="#fff" opacity=".8"/>{eye}<path d="M240 220L220 246L240 263L260 246Z" fill="{a}"/>''',
'tiger':f'''<path fill="url(#body)" d="M155 286Q154 208 184 180L171 114L217 157Q240 149 263 157L309 114L296 180Q326 208 325 286Q287 330 240 330Q193 330 155 286Z"/>{eye}<path d="M194 184L211 211M286 184L269 211M188 250L215 261M292 250L265 261" fill="none" stroke="#7d4b1e"/><path d="M226 246Q240 258 254 246" fill="none"/>''',
'lion':f'''<circle cx="240" cy="225" r="94" fill="{b}" opacity=".55"/><path fill="url(#body)" d="M166 288Q160 207 190 177L176 116L220 156Q240 149 260 156L304 116L290 177Q320 207 314 288Q282 329 240 330Q198 329 166 288Z"/>{eye}<path d="M226 247Q240 258 254 247" fill="none"/>''',
'crocodile':f'''<path fill="url(#body)" d="M108 264Q156 203 242 214Q315 220 371 259L335 286Q282 274 235 284Q176 300 108 264Z"/><path d="M145 247L129 213L164 232M187 229L178 194L211 222M287 237L306 205L318 251" fill="{b}"/>{eye}<path d="M205 264L222 270L240 263L258 270L275 264" fill="none"/>''',
'shark':f'''<path fill="url(#body)" d="M92 264Q165 178 292 214Q339 226 383 264Q329 302 274 306Q160 316 92 264Z"/><path d="M226 213L249 145L277 217M314 286L350 326L309 307" fill="{b}"/><path d="M92 264L55 238L96 286" fill="{a}"/>{eye}<path d="M188 278Q240 292 292 278" fill="none"/>''',
'manta':f'''<path fill="url(#body)" d="M72 286Q132 194 221 214Q240 218 259 214Q348 194 408 286Q337 277 289 313L240 337L191 313Q143 277 72 286Z"/><path d="M220 215L240 160L260 215" fill="{b}"/>{eye}<path d="M214 266Q240 280 266 266" fill="none"/>''',
'griffin':f'''<path fill="url(#body)" d="M169 296Q160 208 198 172Q240 144 282 172Q320 208 311 296Q279 330 240 330Q201 330 169 296Z"/><path d="M205 194L100 138L163 240M275 194L380 138L317 240" fill="{b}"/><path d="M218 157L240 91L262 157" fill="{a}"/>{eye}<path d="M226 248Q240 260 254 248" fill="none"/>''',
'kitsune':f'''<path fill="url(#body)" d="M154 286Q153 205 183 174L171 105L218 155Q240 147 262 155L309 105L297 174Q327 205 326 286Q285 330 240 330Q195 330 154 286Z"/><path d="M186 286Q117 255 104 206Q151 205 184 239M294 286Q363 255 376 206Q329 205 296 239" fill="{b}"/>{eye}<path d="M225 246Q240 258 255 246" fill="none"/>''',
'unicorn':f'''<path fill="url(#body)" d="M160 286Q157 205 187 176L174 122L218 157Q240 149 262 157L306 122L293 176Q323 205 320 286Q284 329 240 330Q196 329 160 286Z"/><path d="M240 176L240 72L267 151Z" fill="{b}"/>{eye}<path d="M226 247Q240 259 254 247" fill="none"/>''',
'pegasus':f'''<path fill="url(#body)" d="M168 290Q160 206 198 171Q240 145 282 171Q320 206 312 290Q280 330 240 330Q200 330 168 290Z"/><path d="M205 195L92 134L155 242M275 195L388 134L325 242" fill="{b}"/><path d="M240 171L240 92L260 152" fill="{a}"/>{eye}<path d="M226 248Q240 260 254 248" fill="none"/>''',
'phoenix':f'''<path fill="url(#body)" d="M240 326Q192 287 201 226Q210 174 240 151Q270 174 279 226Q288 287 240 326Z"/><path d="M205 236L90 170L164 272L126 302L213 280M275 236L390 170L316 272L354 302L267 280" fill="{b}"/><path d="M240 153L240 75L264 143" fill="{a}"/>{eye}<path d="M226 247Q240 260 254 247" fill="none"/>''',
'wyvern':f'''<path fill="url(#body)" d="M165 296Q160 210 198 174Q240 145 282 174Q320 210 315 296Q280 330 240 330Q200 330 165 296Z"/><path d="M205 201L83 125L154 250L112 278L213 270M275 201L397 125L326 250L368 278L267 270" fill="{b}"/><path d="M218 163L240 80L262 163" fill="{a}"/>{eye}<path d="M226 248Q240 260 254 248" fill="none"/>''',
'dragon':f'''<path fill="url(#body)" d="M151 292Q153 205 198 166Q240 140 282 166Q327 205 329 292Q284 332 240 332Q196 332 151 292Z"/><path d="M202 193L82 118L154 252L112 287L211 270M278 193L398 118L326 252L368 287L269 270" fill="{b}"/><path d="M214 164L240 72L266 164" fill="{a}"/>{eye}<path d="M226 249Q240 262 254 249" fill="none"/><path d="M176 288L142 325M304 288L338 325" fill="none"/>''',
'crystal-dragon':f'''<path fill="url(#body)" d="M153 292Q154 205 198 166Q240 140 282 166Q326 205 327 292Q284 332 240 332Q196 332 153 292Z"/><path d="M201 193L82 118L154 252L111 286L211 270M279 193L398 118L326 252L369 286L269 270" fill="{b}"/><path d="M208 166L240 61L272 166L240 143Z" fill="{a}"/>{eye}<path d="M226 249Q240 262 254 249" fill="none"/><path d="M240 143L240 305" fill="none" opacity=".4"/>''',
'void-dragon':f'''<path fill="url(#body)" d="M151 292Q154 204 198 166Q240 139 282 166Q326 204 329 292Q284 332 240 332Q196 332 151 292Z"/><path d="M202 195L82 112L154 253L109 292L211 270M278 195L398 112L326 253L371 292L269 270" fill="#2b225e"/><path d="M214 164L240 58L266 164" fill="{a}"/>{eye}<path d="M226 249Q240 262 254 249" fill="none"/>''',
'whale':f'''<path fill="url(#body)" d="M78 265Q140 183 249 204Q321 216 387 268Q328 300 276 303Q167 311 78 265Z"/><path d="M219 207L244 145L272 212M333 287L381 330L322 307" fill="{b}"/><path d="M82 264L48 229L88 286" fill="{a}"/>{eye}<path d="M187 278Q240 292 293 278" fill="none"/>''',
'leviathan':f'''<path fill="url(#body)" d="M90 286Q132 177 240 194Q348 177 390 286Q319 264 240 332Q161 264 90 286Z"/><path d="M160 230L115 170L185 208M320 230L365 170L295 208M240 197L240 104L264 175" fill="{b}"/>{eye}<path d="M214 257Q240 272 266 257" fill="none"/>''',
'seraph':f'''<path fill="url(#body)" d="M175 300Q166 207 207 166Q240 145 273 166Q314 207 305 300Q274 330 240 330Q206 330 175 300Z"/><path d="M205 192L80 128L152 244L91 285L207 270M275 192L400 128L328 244L389 285L273 270" fill="{b}"/><path d="M220 163L240 73L260 163" fill="{a}"/>{eye}<path d="M226 247Q240 259 254 247" fill="none"/>''',
'kirin':f'''<path fill="url(#body)" d="M174 298Q167 209 205 170Q240 146 275 170Q313 209 306 298Q274 330 240 330Q206 330 174 298Z"/><path d="M205 197L88 140L153 246M275 197L392 140L327 246" fill="{b}"/><path d="M240 171L240 68L268 153L240 134Z" fill="{a}"/>{eye}<path d="M226 248Q240 260 254 248" fill="none"/>''',
'serpent':f'''<path fill="none" d="M103 284Q164 164 252 205Q327 239 379 161Q338 302 252 270Q181 244 103 284Z" stroke="url(#body)" stroke-width="52"/><path d="M379 161L420 136L401 180" fill="{b}"/>{eye}<path d="M385 151Q405 163 415 151" fill="none"/>''',
'chrono-dragon':f'''<path fill="url(#body)" d="M150 292Q154 204 198 166Q240 138 282 166Q326 204 330 292Q284 332 240 332Q196 332 150 292Z"/><path d="M202 195L82 112L154 252L110 291L211 270M278 195L398 112L326 252L370 291L269 270" fill="{b}"/><path d="M240 166L240 62L270 154L240 138L210 154Z" fill="{a}"/>{eye}<path d="M226 249Q240 262 254 249" fill="none"/><circle cx="240" cy="240" r="80" fill="none" stroke="{b}" stroke-opacity=".35" stroke-dasharray="8 10"/>''',
}
    return common + shapes.get(k, shapes['crystal'])

for p in pets:
    (out/f'{p[0]}.svg').write_text(svg(p),encoding='utf-8')

# replace petAssets completely
assets='export type PetVisual = { asset: string; filter: string; accent: string };\n\nexport const PET_VISUALS: Record<string, PetVisual> = {\n'
for id,name,r,price,a,b,k in pets:
    assets += f"  '{id}': {{ asset: '/pets/generated/{id}.svg', filter: 'saturate(1.04) brightness(1.02)', accent: '{a}' }},\n"
assets += "};\n\nexport function getPetVisual(petId: string): PetVisual { return PET_VISUALS[petId] ?? PET_VISUALS.sparky; }\nexport function getPetAsset(petId: string): string { return getPetVisual(petId).asset; }\n"
(root/'src/lib/petAssets.ts').write_text(assets,encoding='utf-8')

# replace catalog block in profileStore
ps=(root/'src/lib/profileStore.ts').read_text(encoding='utf-8')
start=ps.index('export const PET_CATALOG: PetDefinition[] = [')
end=ps.index('\n\nexport const SKIN_CATALOG',start)
cat='export const PET_CATALOG: PetDefinition[] = [\n'
for id,name,r,price,a,b,k in pets:
    cat += f"  {{ id: '{id}', name: '{name}', rarity: '{r}', emoji: '', unlockedByDefault: false, coinPrice: {price if r in ('Common','Rare') else 0}, gemPrice: {price if r in ('Epic','Legendary','Mythic') else 0} }},\n"
cat += ']'
ps=ps[:start]+cat+ps[end:]
(root/'src/lib/profileStore.ts').write_text(ps,encoding='utf-8')

# rewrite PremiumPage NAMES object via generated translations
translations={
'en': {p[0]:p[1] for p in pets},
'ar': dict(zip([p[0] for p in pets], ['سباركي','قط مخملي','أرنب القمر','جرو الجمر','هامستر اللؤلؤ','ببغاء قمة الشمس','بطريق الجليد','سلحفاة الحكيم','حمار كوبالت','ثعلب الشفق','ثعلب الماء النهري','باندا حمراء ياقوتية','راكون الضباب','غزال الصفصاف','فقمة المرجان','بومة الكريستال','كابيبارا ذهبية','ذئب الظلال','نمر الثلج','نسر العاصفة','نمر الشمس','الأسد الملكي','تمساح اليشم','قرش الهاوية','مانتا الشفق','غريفين اليشم','كيتسوني قرمزي','وحيد القرن النجمي','بيغاسوس السماء','عنقاء الخلود','وايفرن العاصفة','تنين الصقيع','تنين الكريستال','تنين الفراغ','حوت سماوي','ليفياثان سقوط النجوم','سيراف سماوي','كيرين ناسج الأحلام','أفعى كونية','تنين الزمن'])),
'fr': dict(zip([p[0] for p in pets], ['Sparky','Chat Velours','Lapin Lunaire','Chiot Braise','Hamster Perlé','Perroquet Soleil','Manchot de Glace','Tortue Sage','Âne Cobalt','Renard Boréal','Loutre Rivière','Panda Rouge Rubis','Raton Brumeux','Cerf Saule','Phoque Corail','Hibou Cristal','Capybara Doré','Loup des Ombres','Léopard des Neiges','Aigle Tempête','Tigre Solaire','Lion Royal','Crocodile Jade','Requin Abyssal','Manta du Crépuscule','Griffon Jade','Kitsune Cramoisi','Licorne Stellaire','Pégase Céleste','Phénix Éternel','Wyverne Tempête','Dragon Givré','Dragon Cristal','Dragon du Vide','Baleine Céleste','Léviathan Stellaire','Séraphin Céleste','Kirin Tisseur de Rêves','Serpent Cosmique','Dragon Chrono'])),
'de': dict(zip([p[0] for p in pets], ['Sparky','Samt-Katze','Mondhase','Glutwelpe','Perlenhamster','Sonnenpapagei','Eispinguin','Weise Schildkröte','Kobaltesel','Aurorafuchs','Flussotter','Rubinroter Panda','Nebelwaschbär','Weidenhirsch','Korallenrobbe','Kristalleule','Goldenes Capybara','Schattenwolf','Schneeleopard','Sturmadler','Solartiger','Königslöwe','Jadekrokodil','Abyss-Hai','Zwielicht-Manta','Jadegreif','Purpur-Kitsune','Sternenlicht-Einhorn','Himmelspegasus','Ewiger Phönix','Sturmwyvern','Frostdrache','Kristalldrache','Leeren-Drache','Himmelswal','Sternenfall-Leviathan','Himmlischer Seraph','Traumweber-Kirin','Kosmische Schlange','Chrono-Drache'])),
'ja': dict(zip([p[0] for p in pets], ['スパーキー','ベルベットキャット','ムーンラビット','エンバーパップ','パールハムスター','サンクレストパロット','アイスペンギン','セージタートル','コバルトロバ','オーロラフォックス','リバーオッター','ルビーレッサーパンダ','ミストラクーン','ウィローディア','コーラルシール','クリスタルオウル','ゴールデンカピバラ','シャドウウルフ','スノーレパード','ストームイーグル','ソーラータイガー','ロイヤルライオン','ジェイドクロコダイル','アビスシャーク','トワイライトマンタ','ジェイドグリフォン','クリムゾンキツネ','スターライトユニコーン','スカイペガサス','エターナルフェニックス','ストームワイバーン','フロストドラゴン','クリスタルドラゴン','ヴォイドドラゴン','セレスティアルホエール','スターフォールリヴァイアサン','セレスティアルセラフ','ドリームウィーバーキリン','コズミックスネーク','クロノドラゴン']))
}
# build TS literal
names='const NAMES: Record<LanguageCode, Record<string,string>> = {\n'
for lang,m in translations.items():
    names += f'  {lang}: '+json.dumps(m,ensure_ascii=False,separators=(',',':'))+',\n'
names += '};'
pp=(root/'src/components/PremiumPage.tsx').read_text(encoding='utf-8')
ns=pp.index('const NAMES: Record<LanguageCode, Record<string,string>> = {')
ne=pp.index('\n\nconst COPY:',ns)
pp=pp[:ns]+names+pp[ne:]
(root/'src/components/PremiumPage.tsx').write_text(pp,encoding='utf-8')

# New migration: catalog prices/names aligned to v9, and old pet catalog entries remain harmless for existing accounts.
mig=root/'supabase/migrations/20260917210000_pet_catalog_v9.sql'
rows=[]
for id,name,r,price,a,b,k in pets:
    rows.append(f"('pet','{id}','{name}','{r}',{price if r in ('Common','Rare') else 0},{price if r in ('Epic','Legendary','Mythic') else 0},true,false)")
sql='''-- StudyQuest v9: replace the visual collection with 40 genuinely different animal/fantasy companions.\ninsert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values\n'''+',\n'.join(rows)+'''\non conflict (item_type,item_id) do update set\n  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price, gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;\n\n-- The starter is earned through study, not purchased.\nupdate public.catalog_items set purchasable=false, coin_price=0, gem_price=0 where item_type='pet' and item_id='sparky';\n'''
mig.write_text(sql,encoding='utf-8')

print('pets',len(pets),'svg',len(list(out.glob('*.svg'))),'migration',mig)
