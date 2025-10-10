'use strict';


/** functions **/


/* functions to set and retrieve cookis. borrowed from 23 schools: */
function set_cookie(cookie_name, cookie_value, expire_days) {
  const d = new Date();
  d.setTime(d.getTime() + (expire_days * 24 * 60 * 60 * 1000));
  let expires = 'expires='+ d.toUTCString();
  document.cookie = cookie_name + '=' + cookie_value + ';' + expires +
                    ';path=/';
};
function get_cookie(cookie_name) {
  let name = cookie_name + '=';
  let decoded_cookie = decodeURIComponent(document.cookie);
  let ca = decoded_cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};
