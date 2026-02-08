(function () {
  var body = document.body;
  var btnMode = document.querySelector('.btn-read-mode');
  var btnSearch = document.querySelector('.btn-search');
  var searchInput = document.getElementById('q');
  var searchForm = document.getElementById('search');
  var exploreLink = document.querySelector('.explore-link');
  var goTop = document.querySelector('.btn-gotop');
  var coverImg = document.querySelector('.cover-img');

  function setMode(mode) {
    if (mode === 'night') {
      body.classList.add('night-mode');
      btnMode.dataset.mode = 'night';
      btnMode.querySelector('i').className = 'fa fa-moon-o';
    } else {
      body.classList.remove('night-mode');
      btnMode.dataset.mode = 'day';
      btnMode.querySelector('i').className = 'fa fa-sun-o';
    }
    localStorage.setItem('mode', mode);
  }

  if (btnMode) {
    var saved = localStorage.getItem('mode') || 'day';
    setMode(saved);
    btnMode.addEventListener('click', function (event) {
      if (event) {
        event.preventDefault();
      }
      var next = btnMode.dataset.mode === 'night' ? 'day' : 'night';
      setMode(next);
    });
  }

  if (btnSearch) {
    btnSearch.addEventListener('click', function (event) {
      if (event) {
        event.preventDefault();
      }
      body.classList.toggle('search-open');
      var open = body.classList.contains('search-open');
      btnSearch.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && searchInput) {
        searchInput.focus();
      }
    });
  }

  document.addEventListener('click', function (event) {
    if (!body.classList.contains('search-open')) {
      return;
    }
    if (btnSearch && btnSearch.contains(event.target)) {
      return;
    }
    if (searchForm && searchForm.contains(event.target)) {
      return;
    }
    body.classList.remove('search-open');
    if (btnSearch) {
      btnSearch.setAttribute('aria-expanded', 'false');
    }
  });

  if (exploreLink) {
    exploreLink.addEventListener('click', function (e) {
      e.preventDefault();
      var indexUrl = exploreLink.getAttribute('data-index-url') || '/search/index.json';
      fetch(indexUrl)
        .then(function (res) { return res.json(); })
        .then(function (pages) {
          if (!pages || !pages.length) return;
          var pick = pages[Math.floor(Math.random() * pages.length)];
          if (pick && pick.permalink) {
            window.location.href = pick.permalink;
          }
        })
        .catch(function () {});
    });
  }

  if (coverImg) {
    var list = coverImg.getAttribute('data-images');
    var items = list ? list.split(',') : [];
    if (items.length) {
      var pick = items[Math.floor(Math.random() * items.length)];
      coverImg.style.backgroundImage = 'url(' + pick + ')';
    }
  }

  if (goTop) {
    goTop.addEventListener('click', function (event) {
      if (event) {
        event.preventDefault();
      }
      window.scrollTo(0, 0);
    });
  }

})();
