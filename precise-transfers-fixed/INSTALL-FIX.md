# Install the corrected website

## Why Run failed

Your old `.vscode/launch.json` opened `http://localhost:8080`, but the project did not
start a server on that port. The new configuration opens index.html directly in Edge.

## Setup

1. Save your current work and back up the original project folder.
2. Extract `precise-transfers-fixed.zip`.
3. Open the extracted `precise-transfers-fixed` folder in VS Code using File > Open Folder.
4. Double-click START-WEBSITE.cmd or index.html to open the website.
5. For VS Code Run/F5, select **Precise Transfers — open website** under Run and Debug.

For Visual Studio rather than VS Code, open index.html or use START-WEBSITE.cmd.
The .vscode settings are specifically for VS Code.

## Updating your existing folder instead

Copy ALL CONTENTS of the extracted folder into:

`C:\Users\willc\Documents\Stellar Works\Precise Transfers\precise-transfers-starter`

Merge folders and replace matching files, including `.vscode/launch.json`, both CSS
files, all HTML pages, js/main.js and the entire assets folder. Do not nest the outer
update folder inside your current project. Refresh with Ctrl+F5 afterward.

Reload any old open editor files from disk, so unsaved old content does not overwrite
the corrected files. Copying index.html alone will not install the font, sunset or icons.

## Included corrections

- Locally bundled Outfit font and its license, with blue gradient headlines/buttons.
- Service/contact icons, blended hero photo and quick booking strip.
- Sunset image behind the contact area and completed footer.
- Wide fleet images with natural proportions and 2021 illustrative label.
- Transparent logo intro, subtle page animations and reduced-motion support.
- Homepage order matching the mockup: hero, trip strip, services, fleet, contact, footer.
- About, Booking, FAQ and Policies on separate working pages.

## Request flow and pending items

The quick strip passes service, date and passengers into booking.html. The full form
prepares an email for the visitor to review and send, with a copy fallback. Nothing
is automatically sent, confirmed or charged. Payment integration is still pending.
Currency, coverage and inclusions still need confirmation. The noindex tag is retained
during development. To change email, replace Precisetransfers1@gmail.com throughout
the HTML and COMPANY_EMAIL in js/main.js.

## Verification

Checked Edge at 360px, 390px, 768px and 1440px: font, images, pages/links, menu, trip
prefill, email fallback, reduced motion, no horizontal overflow and no script errors.
No messages or payments sent. Direct file loading was tested in Edge; the VS Code
F5 interface itself was not automated.

Generated PNG mockups are design references. This implementation matches their
composition and styling with real text and responsive controls; wrapping varies by width.

## Asset provenance

Sunset created with built-in image generation: Caribbean dusk seascape, palms at sides,
open center, natural light, no text or buildings. Saved at assets/images/sunset-footer.png.
Outfit is bundled with its original OFL license. Vehicle/transparent logo assets are
from previous project previews. The client 2018 original remains in the assets folder.
