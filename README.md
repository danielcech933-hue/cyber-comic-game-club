# Cyber Comic Game Club

Online lobby main page pro party hry (AZ Kvíz, Hádej kdo a další minihry) v crazy komiksovém stylu Cyber Comic Noir.

Locked:
- Vizuální směr: Cyber Comic Noir. Tmavé pozadí (#0a0a14), jedovatě neonová zelená (#00FF66), elektrická magenta/růžová (#FF0077), komiksové rámy s diagonálními řezy, halftone šrafování, komiksové bubliny na hlášky a chat, tučná komiksová akční typografie (Bangers a tech sans).
- Hlavní stránka: Online Game Lobby rozcestník pro párty a komunitní hry:
  1. AZ Kvíz (Kyber Pyramida – hexagonální pyramida s písmeny, boj o propojení stran)
  2. Hádej Kdo?! (Identita X – hádání tajemné postavy z indicií a vyřazování kartiček)
  3. Bomb Squad (Tikající bomba – rychlá slovní hra na slabiky)
  4. Komiksový Sketch (Kresli a hádej v reálném čase)
  5. Pivní Kolo Štěstí (Jackpot minihra o žetony a trofeje)
- Klíčové komponenty lobby:
  - Horní komiksová lišta s logem, stavem hráčů online a profilem v komiksové bublině.
  - Živý ticker s komiksovými blesky (upozornění na čekající hráče a nově otevřené stoly).
  - Mřížka herních karet s akční grafikou, počtem volných místností a velkými komiksovými tlačítky (VSTOUPIT, VYZVAT).
  - Postranní komiksový chat a aktivita v bublinách.
  - Spodní akční dok: Rychlá hra (BAAAAM!), Vytvořit místnost s vlastním kódem, Žebříčky šampionů.
  - Funkční dialog pro vytvoření a připojení do místnosti (kód místnosti, počet hráčů, výběr hry).
  - Plně připravené herní místnosti/obrazovky s interaktivním základem pro AZ Kvíz (pyramidová deska s volbou písmen a otázkami) a Hádej Kdo (kartičky postav s otáčením a otázkami), aby byl projekt připraven na další rozšíření přes GitHub a kód.

Open:
- Responzivní přizpůsobení pro mobilní telefony a tablety.
- Lokální stav místností a hráčů (připojení do místnosti, chatování v lobby, generování kódů).
- Herní engine pro otázky a interakci na herní desce.

build a real working app, not a clickable prototype; the screen and kit files show layout, content and look (a wireframe's, structure only) and are never code to copy. The screens are the moments the user designed, not the whole product. Before building, walk through each flow as its user would and design what the pictures leave out, as a product designer would for this product: the steps a flow needs to finish and how the app responds to what the user does, including the moments its users will actually run into, like waiting on something or finding nothing yet. Add nothing a user of this product would never meet, and keep an app the user wants simple, simple. Never leave a step the product's core flows need as "coming soon", unless the brief says the user chose to. Where such a step needs an outside service, build every part up to it and say in your reply what's left to connect. Fill product gaps only, never a look the design set: an added step reuses the UI kit's tokens, chrome and parts and the nearest designed screen's layout, with no new visual direction. Look at every screen's picture before writing code; design.md says which picture or sheet holds each screen. Open the UI kit's shells and parts HTML for the header, tab bar, composer and components, not only its tokens. Use each finished screen's copy exactly as design.md lists it; never invent copy for one. A wireframe under design.md's Wireframes gives structure only: build it in the design's look, as design.md says. The screens' photos are placeholders for the mockups only: replace every photo design.md lists with the user's own upload for it, else as design.md says (a photo without people re-composed with imagegen--edit_image from it as a reference, a photo of people generated from its brief and never from the photo), and ship no set photo or its URL. For a design that came with no design.md, every photo on assets.lovable.dev or images.unsplash.com is a set photo: replace it with the user's own upload for it, else a new image generated for its slot, any person in it one who doesn't exist, never from the photo or a picture showing it. Build and check each screen at the canvas it was drawn at: phone 393×764, tablet landscape 1133×744, tablet portrait 744×1133, desktop 1280×832. After building, screenshot the app at those sizes and states, compare each finished screen with its picture, and fix every visual difference you didn't choose; check a wireframe's screen against its structure, never its grey look. End your reply with "Changed from the mockups": each deliberate change and why, and "Added beyond the mockups": each step, state or interaction you built that no screen shows.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cyber-comic-game-club.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/073e7e8b-28c7-498c-b6b5-5b259cb0af4b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
