# 证物纯底素材 · 第 21 轮

使用内置 image_gen 图像编辑模式提取透明物件，并为原先没有独立图的钥匙补制证物图；界面统一提供 #c7bea9 纯色底。原素材未删除。用途是替代旧黑雾图集与场景裁切，不修改剧情或存档。

覆盖全部 40 件证物：16 项独立透明物件（有名面具复用无名面具图片）、12 项透明图集单元、3 项核验记录、4 项记忆卡、5 项推理记录图。去重后为 15 张独立 PNG 加 1 张图集；其中本轮新增 12 张独立图和 1 张清底图集。图集显示时按实际行分界裁切，不带入相邻单元的碎片。闭馆曲对照也改为浅底波形记录，不保留原来的黑色波形条。所有证物展示入口共用同一渲染函数。

## 共享提示词

```text
Use case: background-extraction
Asset type: square game evidence illustration, clean isolated physical object.
Image 1 is the edit target, a room containing the evidence. Image 2 is the edge quality and illustrated material finish reference only.
Extract/reconstruct ONLY the specified object into a centered standalone evidence cutout. Preserve the object's identity, colors, visible distinctive details and illustrated style from Image 1. Show the complete object clearly, no scene fragment or furniture. Object occupies around 76-82 percent of a square canvas, with clear margins on all sides.
Output genuinely transparent alpha outside its silhouette, including any holes. The game supplies a solid warm gray-beige backing, like the clean reference. No black fog, dark vignette, smudges, white matte, checkerboard, drop shadow cloud, scenery, props, UI frame, lettering beyond the specified object's own markings, or watermark. Do not use a colored backdrop. Crisp illustration contours, neutral readable lighting.
SPECIFIC OBJECT:
```

参考图 2 均为 `assets/28_evidence_sealed_name_v2.png`；每个任务单独生成一张 PNG。除厨房钥匙外，下列 SPECIFIC OBJECT 接在共享提示词之后，构成实际完整提示词。厨房钥匙以房间作为金属质感与画风参考生成，不声称是从原房间截图抠出的物件。

## repairLabel

- 输出：`assets/evidence-clean/repairLabel.png`
- 编辑目标：`assets/14_scene_collection_room_open_evidence_v3.png`
- SPECIFIC OBJECT：

```text
The aged rectangular paper repair label lying in the open bottom drawer. Keep its small ruled entries and distinct four-point star, and the clear handwritten Chinese surname "林" at the right (NOT "田"). Rotate the paper to a gently tilted frontal view; keep whole paper and its worn corners. Tiny cursive writing may stay impressionistic; surname 林 must remain correct.
```

## visitorLedger

- 输出：`assets/evidence-clean/visitorLedger.png`
- 编辑目标：`assets/15_scene_seaside_any_house_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The open cream handwritten register book on the central stand, both pages and its dark brown cover visible. Remove the stand, table, wall and pins. Keep fine cursive rows and black ribbon bookmark, mildly three-quarter view; no invented legible names or new symbols.
```

## cosplayCostume

- 输出：`assets/evidence-clean/cosplayCostume.png`
- 编辑目标：`assets/15_scene_seaside_any_house_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The full midnight-blue, cream and muted gold costume on the mannequin at the right. Extract the long layered coat, shirt, belt, dark trousers and black boots, on its simple headless mannequin. Preserve the large frayed missing-button area on its right-in-image shoulder, dark blue cape, four-point star brooch and gold trim. No person, face or scene. Full costume visible, no cropped hem.
```

## backstagePhoto

- 输出：`assets/evidence-clean/backstagePhoto.png`
- 编辑目标：`assets/15_scene_seaside_any_house_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The single aged sepia backstage group photograph pinned on the central wall. Isolate just the rectangular photograph with its cream scalloped paper edge, no corkboard or pins. Preserve its group of costumed stage performers and their original old-photo rendering. The story's key detail must be readable: at the lower-right edge of the photo, only the hands of an off-camera helper reach in to sew a star-shaped shoulder button on a performer's costume; the helper is not a person posing in the group. Keep this subtle but visible in a close evidence view. Do not include any UI words.
```

## harborKeyTag

- 输出：`assets/evidence-clean/harborKeyTag.png`
- 编辑目标：`assets/15_scene_seaside_any_house_evidence_v2.png`
- SPECIFIC OBJECT：

```text
One solid elongated oval brass room-key tag, like the tag on the far right of the left-side wooden key rack. Include its small metal ring only, no rack, key, number text or wall. Preserve brushed aged brass and simple engraved border; gently angled, entire tag visible.
```

## doorKey

- 输出：`assets/evidence-clean/doorKey.png`
- 编辑目标：`assets/15_scene_seaside_any_house_evidence_v2.png`
- SPECIFIC OBJECT：

```text
One antique brass key from the left key rack, isolated alone. Its bow is a small open rectangular door-shaped frame, with tasteful simple gold engraving, long stem and normal key teeth. Match the room's existing brass material and game illustration style. Entire key visible diagonally, no key rack or label.
```

## recipeCard

- 输出：`assets/evidence-clean/recipeCard.png`
- 编辑目标：`assets/16_scene_late_night_kitchen_open_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The single cream handwritten recipe card lying on the foreground table. Preserve its cursive dark lines, small drawings of a bowl, spoon and herb sprig, and restrained tea marks on the paper itself. Paper is the complete object; no wood or table shadows. Show slightly tilted top-down, with all four corners visible.
```

## kitchenTimer

- 输出：`assets/evidence-clean/kitchenTimer.png`
- 编辑目标：`assets/16_scene_late_night_kitchen_open_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The round antique brass mechanical kitchen timer standing on the upper-right shelf. Keep its cream dial, central black pointer, clear minute marks 0 to 55 in steps of 5 and small dark base. Only the timer, no shelf, hanging pans or wall. Frontal slight three-quarter view with full rim visible.
```

## spiceJar

- 输出：`assets/evidence-clean/spiceJar.png`
- 编辑目标：`assets/16_scene_late_night_kitchen_open_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The large clear glass jar of red-brown spice at the left foreground, with its brass screw lid, rope neck tie, small round brass hanging medallion. Preserve the four-point star on the lid and medallion and number 1907 as shown. Entire jar visible, no desk or vase; glass remains softly translucent and clean at its edges.
```

## cookingPhoto

- 输出：`assets/evidence-clean/cookingPhoto.png`
- 编辑目标：`assets/16_scene_late_night_kitchen_open_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The single sepia photograph propped in the suitcase. Only the cream scalloped-edge photo showing two flour-covered hands kneading dough. Preserve the composition of forearms, dough and flour within the printed photograph. No suitcase, cloth, other photo, black scene outside the photographic paper. Entire photo visible front-on with a slight natural tilt.
```

## travelTicket

- 输出：`assets/evidence-clean/travelTicket.png`
- 编辑目标：`assets/16_scene_late_night_kitchen_open_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The single cream-and-blue illustrated seaside railway ticket/postcard in the suitcase at the right. Keep blue sea, coastal train, pale cliffs and the small blank address/invitation panel in lower-right, old folded paper and ticket-notched right edge. Extract the complete printed paper only, no suitcase or background. No added legible words.
```

## kitchenKey

- 输出：`assets/evidence-clean/kitchenKey.png`
- 编辑目标：`assets/16_scene_late_night_kitchen_open_evidence_v2.png`
- SPECIFIC OBJECT：

```text
The story's small antique brass kitchen exit key, illustrated as an isolated prop matching the suitcase fittings and brass utensils in this room. A round bow enclosing a tiny spoon silhouette, slender stem, simple key teeth; entire key at a diagonal. Elegant restrained gold, not glowing. No suitcase, furniture, paper or other object.
```

### 厨房钥匙实际生成提示词

```text
Use case: stylized-concept
Asset type: isolated game evidence cutout.
Image 1 is room palette/material style reference only, not an object to extract. Image 2 is clean illustration-edge reference. Create this story prop: The story's small antique brass kitchen exit key, illustrated as an isolated prop matching the suitcase fittings and brass utensils in this room. A round bow enclosing a tiny spoon silhouette, slender stem, simple key teeth; entire key at a diagonal. Elegant restrained gold, not glowing. No suitcase, furniture, paper or other object.
Square canvas, centered complete object occupying 78 percent, ample margins, genuinely transparent alpha background. No black fog, dark vignette, checkerboard, matte halo, shadow cloud, room backdrop, lettering or UI. App supplies a uniform warm gray-beige surface.
```

## 旧图集

- 输出：`assets/33_evidence_atlas_clean.png`
- 输入：`assets/21_evidence_atlas.png`，质感参考同上。
- 编辑要求：仅移除 5×4 图集中所有物件外的黑蓝底、暗角、烟雾、金框、网格线，保留 20 个物件各自的顺序、形状、真正的黑色材质与金色细节；输出真实透明背景、清晰轮廓、不带泛光和阴影云；各对象完整置于对应等大单元内，保持 5:4 总图比例。

```text
Use case: background-extraction
Production game evidence sprite atlas. Image 1 is the edit target; Image 2 is edge quality reference only.
Remove ONLY the black/navy smoky background, dark haze, gold outer frames, grid lines and vignettes surrounding every object. Output genuine transparent alpha outside the actual object silhouettes, including their holes. No replacement background, no checkerboard.
Keep exactly FIVE equal columns and FOUR equal rows of square cells, twenty objects in their original row-major order and original angle. Each entire object fits centered in its own cell with 10% padding. Preserve legitimate black surfaces of objects, golden engraving and fine sharp outlines. No object redesign, no blur, no shadow cloud, no glow, no matte halo. Glowing cards keep the card itself but lose surrounding glow. Last cell keeps its four-point star only, no dark square.
The app supplies the warm-gray paper behind the transparent image. Transparent layout must tile precisely with no gutters. High resolution 5:4 landscape, ideally 2000x1600. No text or numbering.
```
