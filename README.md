# SyncTube-QSwitcher

Quality switcher plugin for [SyncTube](https://github.com/RblSb/SyncTube).


## Installation

- Create or edit `user/res/js/custom.js` file in SyncTube directory:
  ```js
  'use strict';
  const JsApi = client.JsApi;
  JsApi.addPlugin('qswitcher');
  ```

- Create `user/res/plugins/` folder and navigate to it in terminal: `cd user/res/plugins`

- `git clone https://github.com/aNNiMON/SyncTube-QSwitcher.git qswitcher`


## How it works

1. When a raw video starts playing, QSwitcher matches its url with a matcher regex `^(https?.*_)(${Q})p\.(mp4|webm|m3u8?)`
2. If the video is supported and url is matched, QSwitcher starts checks for other video links. To do this it replaces `${Q}` with quality values defined in `qualities: ['360', '480', '720', '1080']`.
  - For example, if url is `https://site.url/1b3720ac1080460c9_480p.mp4`, it matches regex `(https://site.url/1b3720ac1080460c9_)(480)p.(mp4)`
  - Now the plugin starts checking qualities 360, 480, 720, 1080.
  - To do this it substitutes matched groups with `$1${Q}p.$3`: `https://site.url/1b3720ac1080460c9_360p.mp4`
  - So, these urls will be checked: `https://site.url/video_360p.mp4`, `https://site.url/video_480p.mp4`, `https://site.url/video_720p.mp4` and `https://site.url/video_1080p.mp4`
3. If there are two or more existing links, a switcher is created with these quality values.

**TIP**: you can remove some quality values if you want to reduce the number of requests.

Here is some other examples for matcher:
```js
['^(https?.*_)(${Q})p\.(mp4|webm|m3u8?)', '$1${Q}p.$3']
// mathes https://site.url/1b3720ac1080460c9_480p.mp4

['^(https?.*\/)(${Q})(\/.*?\.)(mp4|webm|m3u8?)', '$1${Q}$3$4']
// matches https://site.url/videos/title/480/episode_1.m3u8

['^(https?.*\/)(${Q})(\/.*?_)(${Q})\.(mp4|webm|m3u8?)', '$1${Q}$3${Q}.$5']
// matches https://site.url/videos/title/480/episode_1_480.m3u

qualities: ['HD', 'FullHD', '4K'],
matcher: ['^(https?.*_)(${Q})\.(mp4|webm|m3u8?)', '$1${Q}.$3']
// matches https://site.url/episode_1_HD.mp4, https://site.url/episode_1_FullHD.mp4 and https://site.url/episode_1_4K.mp4
```
