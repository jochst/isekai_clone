// Downloads shared (site-wide) static assets for isekaizero.ai into public/sites/isekaizero-ai-0e4f18da/shared
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const ORIGIN = 'https://www.isekaizero.ai';
const OUT = path.resolve('public/sites/isekaizero-ai-0e4f18da/shared');
const files = {
  'fonts/Poppins-Regular.ttf': '/assets/assets/fonts/Poppins/Poppins-Regular.093ee89be9ede30383f39a899c485a82.ttf',
  'fonts/Poppins-Medium.ttf': '/assets/assets/fonts/Poppins/Poppins-Medium.bf59c687bc6d3a70204d3944082c5cc0.ttf',
  'fonts/Poppins-Bold.ttf': '/assets/assets/fonts/Poppins/Poppins-Bold.08c20a487911694291bd8c5de41315ad.ttf',
  'fonts/Roboto-Regular.ttf': '/assets/assets/fonts/Roboto/Roboto-Regular.327362a7c8d487ad3f7970cc8e2aba8d.ttf',
  'fonts/Roboto-Medium.ttf': '/assets/assets/fonts/Roboto/Roboto-Medium.6679d67d72e0e7b34f407bac6df715ab.ttf',
  'fonts/Roboto-Bold.ttf': '/assets/assets/fonts/Roboto/Roboto-Bold.2e9b3d16308e1642bf8549d58c60f5c9.ttf',
  'images/logo-word.png': '/assets/assets/AlterworldLogoIcon.123c4cc271c2ae6748d8b57443332253.png',
  'images/logo-icon.png': '/assets/assets/isekaiLogo.f621c6f90e741bd7523af34a72ae784b.png',
  'images/app-icon.png': '/assets/assets/icon.b7d5f8e560668e61914a0e5891596584.png',
  'images/nav-home-gradient.png': '/assets/assets/HomeGradient.4c6cf2b989b757382b7a41298b348533.png',
  'images/nav-home-white.png': '/assets/assets/HomeWhite.c66d15a7d28df15d1cbaa780e8acbc9d.png',
  'images/nav-explore-gradient.png': '/assets/assets/ExploreGradient.943f993f9844699e33bbd4561667f86d.png',
  'images/nav-explore-white.png': '/assets/assets/ExploreWhite.6ebf4e1dff414ae065c825479e100fb0.png',
  'images/nav-creation-gradient.png': '/assets/assets/CreationGradient.e64b683f3ab135dc7719e0949242b6d8.png',
  'images/nav-creation-white.png': '/assets/assets/CreationWhite.7837597672fe0ca31c740d67c9bf367a.png',
  'images/nav-chat-gradient.png': '/assets/assets/ChatGradient.b6a8bd2da114bf5441012a3ee336ca94.png',
  'images/nav-chat-white.png': '/assets/assets/ChatWhite.a713c8c254cd74c995033d562644e322.png',
  'images/nav-profile-gradient.png': '/assets/assets/ProfileGradient.8877b01a6a052e5f9bc71f82c3a465df.png',
  'images/nav-profile-white.png': '/assets/assets/ProfileWhite.dadf3815290b56786439537a08287eed.png',
  'images/crystal-blue.png': '/assets/assets/blueCrystal.c8a5c2ffe4cbdfed99bcb0604aa8447b.png',
  'images/crystal-purple.png': '/assets/assets/purpleCrystal.f0eefb6b4fd6b38695600dd2f33ea3ee.png',
  'images/mana-credit.png': '/assets/assets/mana-credit.187874f7c41adb963dc62e37bf9f0f3a.png',
  'images/arcane-credit.png': '/assets/assets/arcane-credit.56c9792116d30b0bd4bfe3e60d142627.png',
  'images/badge-google-play.png': '/assets/assets/googleDownload.2a689a4ecbce9203c7fd54e48f2c35d6.png',
  'images/badge-app-store.png': '/assets/assets/appleDownload.87577048714fb75b97bc6332e70d9d62.png',
  'images/app-background.png': '/assets/assets/AppBackground.e55bc9168d57da2ad0ce1d1b944a3942.png',
  'images/default-cover.png': '/assets/assets/defaultCover.ce602e8cfe186d16f36ae9fda1d787ea.png',
  'images/mystery-character.webp': '/assets/assets/mystery-character.babdf1c702955c9e2d7f3caf871b1c41.webp',
  'images/mystery-character-square.webp': '/assets/assets/mystery-character-square.55fe2bea74369aae279d0803f69fe1c7.webp',
  'images/magical-button.png': '/assets/assets/magicalButton.92641b61adfbecf779525a96f2c9eb09.png',
  'images/collect-button.png': '/assets/assets/CollectButton.1b67a30b9f0bd379d1906671956d3bdc.png',
  'images/like-button.png': '/assets/assets/LikeButton.c15f5ab4cc268773864a05e29eb9f10e.png',
  'images/enhance-icon.png': '/assets/assets/enhance-icon.436f04e1ca2520c82cdc6c4365edf62b.png',
  'images/person-icon.png': '/assets/assets/PersonIcon.4efdde7cccfcba17227a3ff451a1a7b3.png',
  'images/setting-icon.png': '/assets/assets/settingIcon.5dce486efbc0283a6465aa050f4154c7.png',
  'images/book-icon.png': '/assets/assets/BookIcon.e446c33da6645003856e1c15000ed40a.png',
  'images/character-creation.png': '/assets/assets/CharacterCreation.ce9abb3e19b27771fa432ecb0c8b031e.png',
  'images/storyline-creation.png': '/assets/assets/StorylineCreation.317d1bbc5517f5f14e9dd6cd0542cde9.png',
  'images/music-creation.png': '/assets/assets/musicCreation.8a343c7730fb9c6f01a7126a64120e7b.png',
  'images/album-creation.png': '/assets/assets/albumCreation.7e1f16b4ecbaf87a5e1b393a7e04a48f.png',
  'images/og-image.png': '/og-image.png',
  'images/favicon.ico': '/favicon.ico',
};
const entries = Object.entries(files);
let ok = 0, fail = [];
for (let i = 0; i < entries.length; i += 4) {
  await Promise.all(entries.slice(i, i + 4).map(async ([rel, src]) => {
    try {
      const res = await fetch(ORIGIN + src);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      const dest = path.join(OUT, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      ok++;
    } catch (e) { fail.push(rel + ': ' + e.message); }
  }));
}
console.log(`downloaded ${ok}/${entries.length}`);
if (fail.length) console.log('failed:\n' + fail.join('\n'));
