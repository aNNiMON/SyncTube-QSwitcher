synctube.qswitcher = class {

  constructor({api, path}) {
    this.api = api;
    this.quality = '';
    window.QSwitcher = {
      // List of qualities to check
      qualities: ['360', '480', '720', '1080'],
      // Url to match/replace. Note: ${Q} is an extra pattern that matches qualities listed above
      matcher: ['^(https?.*_)(${Q})p\.(mp4|webm|m3u8?)', '$1${Q}p.$3']
    };
    api.notifyOnVideoChange(this.addSwitcher.bind(this));
    api.notifyOnVideoRemove(this.hideSwitcher.bind(this));
    this.addStyles(`${path}/styles.css`);
  }

  addSwitcher(item) {
    this.hideSwitcher(item);
    // Add/show qualities panel on matched raw videos 
    if (item.isIframe || item.duration < 60 * 5) return;
    const {qualities, matcher} = window.QSwitcher;
    if (qualities.length == 0 || matcher.length != 2) return;
    const fullMatcher = new RegExp(matcher[0].replace('${Q}', qualities.join('|'), 'ui'));
    if (!item.url.match(fullMatcher)) return;

    let videoUrls = qualities
      .map(q => matcher[1].replace('${Q}', q))
      .map(replaceStr => item.url.replace(fullMatcher, replaceStr));
    this.checkQualityUrls(videoUrls, qualities, results => {
      // Skip if there are not enough videos to switch
      if (!results || results.length <= 1) return;

      // Create qswitcher and sub-menu if not exists
      let qswitcher = document.getElementById('qswitcher');
      let qswitcherMenu = document.getElementById('qswitcher_menu');
      if (qswitcher == null) {
        const syncToggle = document.getElementById('togglesynch');
        qswitcher = document.createElement('span');
        qswitcher.id = 'qswitcher';
        qswitcher.title = 'Switch quality';
        syncToggle.parentNode.insertBefore(qswitcher, syncToggle);

        qswitcherMenu = document.createElement('ul');
        qswitcherMenu.id = 'qswitcher_menu';
        qswitcher.appendChild(qswitcherMenu);
        qswitcher.insertBefore(document.createTextNode('?'), qswitcherMenu);
      }

      //  Populate the list of available videos
      let qualityIndex = videoUrls.indexOf(item.url);
      this.quality = qualities[Math.max(0, qualityIndex)];
      results.forEach(({quality, size}) => {
        let li = document.createElement('li');
        li.innerHTML = `${quality} <span>${size}</span>`;
        li.onclick = (e) => {
          // Switch url and restore time
          qswitcher.firstChild.textContent = quality;
          this.quality = quality;
          const newSrc = item.url.replace(fullMatcher, matcher[1].replace('${Q}', quality));
          const currentTime = this.api.getTime();
          this.api.setVideoSrc(newSrc);
          this.api.setTime(currentTime);
        };
        // Add item to menu
        qswitcherMenu.insertBefore(li, qswitcherMenu.firstChild);
      });
      // Update current quality and show switcher
      qswitcher.firstChild.textContent = this.quality;
      qswitcher.style.display = 'flex';
    });
  }

  hideSwitcher(item) {
    // hide switcher and remove all items from menu
    let qswitcher = document.getElementById('qswitcher');
    if (qswitcher != null) {
      qswitcher.style.display = 'none';
    }
    let qswitcherMenu = document.getElementById('qswitcher_menu');
    if (qswitcherMenu != null) {
      qswitcherMenu.innerHTML = '';
    }
  }

  checkQualityUrls(videoUrls, qualities, callback) {
    let promises = videoUrls
      //.map(url => `https://cors-anywhere.herokuapp.com/${encodeURI(url)}`)
      .map(url => `/proxy?url=${encodeURI(url)}`)
      .map(url => fetch(url, {redirect: 'manual'}));
    Promise.all(promises)
      .then(responses => {
        // For all requests, take only successfull 
        const result = responses.reduce((acc, resp, i) => {
          if (resp.ok) {
            return acc.concat({
              quality: qualities[i],
              size: this.formatBytes(resp.headers.get('content-length') || 0)
            });
          }
          return acc;
        }, []);
        callback(result);
      });
  }

  formatBytes(bytes) {
    const k = 1024;
    if (bytes < k) return '';
    const sizes = ['', 'KiB', 'MiB', 'GiB', 'TiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat(bytes / Math.pow(k, i));
    return value.toFixed(value < 10 ? 2 : 0) + ' ' + sizes[i];
  }

  addStyles(cssUrl) {
    const link = document.createElement('link');
    link.href = cssUrl;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
}
