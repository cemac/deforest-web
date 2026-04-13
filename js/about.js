'use strict';


/** global variables: **/


/* site variables: */
var site_vars = {
  /* language settings: */
  'language': null,
  'text_url': 'text',
  'text': {}
};


/** functions **/


/* text loading function: */
async function load_text(text_language) {
  /* set language first. if not defined ... : */
  if ((text_language == null) ||
      (text_language == undefined)) {
    /* check for cookie value first: */
    var stored_language = get_cookie('deforest_language');
    /* if a value is retrieved ... : */
    if (stored_language != '') {
      /* use stored value: */
      text_language = stored_language;
    } else {
      /* try to detect from browser: */
      var browser_language = navigator.language;
      /* check for portugese: */
      if (browser_language.search(/^pt/) == 0) {
        text_language = 'pt';
      /* check for spanish: */
      } else if (browser_language.search(/^es/) == 0) {
        text_language = 'es';
      /* check for french: */
      } else if (browser_language.search(/^fr/) == 0) {
        text_language = 'fr';
      /* check for indonesian: */
      } else if (browser_language.search(/^id/) == 0) {
        text_language = 'id';
      /* check for swahili: */
      } else if (browser_language.search(/^sw/) == 0) {
        text_language = 'sw';
      /* check for chinese: */
      } else if (browser_language.search(/^zh/) == 0) {
        text_language = 'zh';
      /* else, use english: */
      } else {
        text_language = 'en';
      };
    };
  /* use english, if unknown language specified ... :*/
  } else if ((text_language != 'pt') && (text_language != 'es') &&
             (text_language != 'fr') && (text_language != 'id') &&
             (text_language != 'sw') && (text_language != 'zh')) {
      text_language = 'en';
  };
  /* set site language: */
  site_vars['language'] = text_language;
  set_cookie('deforest_language', text_language, 3);
  /* load text: */
  var language_file = site_vars['text_url'] + '/' +
                      text_language + '.json';
  await fetch(language_file, {'cache': 'no-cache'}).then(
    async function(text_req) {
      /* if successful: */
      if (text_req.status == 200) {
        /* store json information from request: */
        site_vars['text'][text_language] = await text_req.json();
      } else {
        /* log error: */
        console.log('* failed to load text from: ' + language_file);
        site_vars['text'][text_language] = null;
      };
    }
  );
  /* if text load was successful ... : */
  if (site_vars['text'][text_language] != null) {
    /* text for this language: */
    var language_text = site_vars['text'][text_language];
    /* update html elemnts. title: */
    document.title = language_text['title'];
    var el_title_a = document.getElementById('title_a');
    el_title_a.innerHTML = language_text['title'];
    /* text: */
    var el_content_text = document.getElementById('content_text');
    el_content_text.innerHTML = language_text['about_text'];
    /* links: */
    var el_link_home = document.getElementById('link_home');
    el_link_home.innerHTML = language_text['link_home'];
    var el_link_about = document.getElementById('link_about');
    el_link_about.innerHTML = language_text['link_about'];
  };
  /* underline active language link: */
  var language_links = document.getElementsByClassName('language_link');
  for (var i = 0 ; i < language_links.length ; i++) {
    var language_link = language_links[i];
    language_link.style.textDecoration = 'none';
  };
  var language_link_active = document.getElementById('language_link_' + text_language);
  language_link_active.style.textDecoration = 'underline';
  /* check active language radio input: */
  var language_radios = document.getElementsByClassName('language_input');
  for (var i = 0 ; i < language_radios.length ; i++) {
    var language_radio = language_radios[i];
    language_radio.checked = false;
  };
  var language_radio_active = document.getElementById('language_input_' + text_language);
  language_radio_active.checked = true;
};


/** add listeners: **/


/* on page load: */
window.addEventListener('load', function() {
  /* load text: */
  load_text();
});
