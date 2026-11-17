# Fonts

Chosen by the owner 2026-11-17 (option C). Both are licensed under the **SIL Open Font License 1.1**, verified 2026-11-17 from the upstream repositories (not from a third-party mirror). Files are self-hosted in `public/fonts/`; the site makes no third-party font requests.

| Use | Family | Designer / source | Licence (verified from) | File shipped | Size |
| --- | --- | --- | --- | --- | --- |
| Headlines | Source Serif 4, **Display** optical size, Regular | Adobe; https://github.com/adobe-fonts/source-serif, release 4.005R (2023-01-20), `source-serif-4.005_WOFF2.zip`, file `TTF/SourceSerif4Display-Regular.ttf.woff2` | OFL 1.1; `LICENSE.md` in that repo; GitHub reports `OFL-1.1` | `SourceSerif4Display-Regular.woff2` | 81,964 bytes |
| Body and UI | Hanken Grotesk, variable weight 100 to 900 | Alfredo Marco Pradil, Hanken Design Co.; https://github.com/marcologous/hanken-grotesk (the upstream named in the Google Fonts `upstream_info.md`), `fonts/webfonts/HankenGrotesk[wght].woff2` | OFL 1.1; `OFL.txt` in that repo; GitHub reports `OFL-1.1`; also OFL in `google/fonts` | `HankenGrotesk-wght.woff2` | 62,244 bytes |

Licence texts are shipped beside the fonts: `public/fonts/OFL-SourceSerif4.md`, `public/fonts/OFL-HankenGrotesk.txt`.

## Conditions that matter (OFL 1.1)

- Embedding and redistribution with the site is permitted; the licence text travels with the fonts (done).
- The fonts are not sold on their own.
- **Source Serif 4 declares the Reserved Font Name "Source".** A *modified* version may not use that name. So the file is Adobe's own WOFF2, **not subsetted, converted or renamed**. If the weight ever needs trimming, the trimmed font must be renamed first.
- Hanken Grotesk declares no Reserved Font Name; the shipped file is still upstream's unmodified WOFF2.
- The CSS `font-family` aliases in `global.css` are site-local names, not modified font software.

## Integrity

SHA-256 of the files as shipped:
    170db667e22d3d138440de92431b2a4c7695ad06bef89354e59b25b4114dd7eb  HankenGrotesk-wght.woff2
    c75301c83bef55b3787f3060c2f62cb5d902a6706419149b7ff9d0c7927055ac  SourceSerif4Display-Regular.woff2
