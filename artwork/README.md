# Osaka / Kansai — Places source photo to Vintage Watercolor

This is an offline publishing workflow, not a website image generator. The published site stays unchanged until approved artwork exists. We reuse the installed Vintage Watercolor Style Pack manifest (palette and material grammar) and real scene photos in trip.json. A generic Style Pack SVG is not a photograph of a real landmark.

## Three scenes, four Places items

| Scene | item IDs | Photo rights |
| --- | --- | --- |
| 夫婦岩 | ise-futami | Public domain; Marubatsu / Wikimedia Commons |
| 伏見稻荷千本鳥居 | d05-fushimi-visit | CC0 1.0; Sizableframe / Wikimedia Commons |
| 青岸渡寺三重塔＋那智瀑布 | d09-seigantoji, d09-nachi-falls | CC BY-SA 4.0; Naokijp / Wikimedia Commons |

The Nachi image is shared by two Places items; generate one illustration. Full image URLs, credit, rights and scene-specific geometry anchors are in [osaka-pilot.json](osaka-pilot.json).

## Commands (Node >= 22)

    npm run artwork:plan
    OPENAI_API_KEY=YOUR_SECRET npm run artwork:generate
    npm run artwork:apply
    npm run test:artwork

- Plan: validate all three source pictures against trip.json; print effective image-to-image prompts. Local only; no API key or cost.
- Generate: download the original Commons photograph, send the actual image plus a Style Pack-derived prompt to the OpenAI Image Edits API. Produce 1536x1024 WebP assets in artwork/staging/. The default model is gpt-image-2.5-flare, overridable through OPENAI_IMAGE_MODEL to another reviewed GPT Image 2.5 or 2.6 model. This step incurs API charges, does not touch trip.json and never overwrites an existing candidate silently.
- Apply: only scenes with reviewStatus=approved, reviewedBy and a known artworkLicense can be promoted. The script checks each WebP and copies it to assets/places/vintage-watercolor/ while updating existing Places infoCard image metadata. The photo source remains traceable.
- Test: ensure sources, IDs, fidelity instructions, attribution and CC BY-SA obligations remain valid.

Keep OPENAI_API_KEY only in a local terminal or managed secret; never in GitHub Pages, JavaScript distributed to browsers, Git history or trip.json.

## Review and release

1. Confirm every original photo matches the location and Wikimedia Commons rights page. Check the illustration: two Meotoiwa rocks with one joining rope; a real centered Fushimi torii passage; pagoda LEFT and waterfall RIGHT at Nachi. Reject fabricated architecture, signs, objects, people or false characters.
2. Accept each scene explicitly in the JSON (reviewStatus, reviewedBy, artworkLicense). A derivative of a CC BY-SA 4.0 photo remains CC BY-SA 4.0 and must carry a modification notice. A CC0 source does not automatically assign the new AI illustration a CC0 license; the publisher must review the generated artwork usage terms.
3. Run artwork:apply only after visual approval; commit the resulting trip.json and generated WebPs together. Existing photo source links, attribution and sensible alt must remain. If no artwork is approved, published trip.json remains unchanged.
4. Run test:artwork, test:places-curation, test:uiux, test:timeline, lint:uiux and the Places/Style Pack browser suites; verify 320/390/1100/1920px, 200% text and offline behavior. The current client hides an image on load failure while retaining the guide. Never claim visual PASS from a dry-run.
5. Do not add a large Overview hero: the compact Overview rule in docs/UIUX.md P1.12 remains mandatory. This pilot changes no Journey/Timeline, map, weather, schedule or appearance behavior.

The two Places entries without licensed photos (玄武洞 and 狼煙山遊園) remain uncovered: do not invent site-specific scenes from a name alone.
