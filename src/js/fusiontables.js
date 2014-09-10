// Generated by CoffeeScript 1.6.3
(function() {
  var FUSION_TABLES_URI, add_related_url, build_gazcomp_driver, check_table_access, default_gazcomp_config, delete_cookie, expires_in_to_date, filter_url_params, fusion_tables_escape, fusion_tables_query, gazcomp_config, get_cookie, get_next_gazcomp_pair, google_oauth_parameters_for_fusion_tables, google_oauth_url, load_gazcomp_pair, load_related_urls, parse_query_string, process_gazcomp_result, set_access_token_cookie, set_author_name, set_cookie, set_cookie_expiration_callback;

  FUSION_TABLES_URI = 'https://www.googleapis.com/fusiontables/v1';

  gazcomp_config = {};

  default_gazcomp_config = {
    google_client_id: '69738617359-b0v88ji0eih9h06kdn9v8nvmlenm054e.apps.googleusercontent.com',
    worklist_fusion_table_id: '1oIZtbS3FnxYuuH2PFtEaiwRyO1GjlB1RrkPlOSRP',
    votes_fusion_table_id: '1VTBoUl4C-IuZqyqC2-XNjcyp4x6fjNHUiH17mBB7'
  };

  google_oauth_parameters_for_fusion_tables = {
    response_type: 'token',
    redirect_uri: window.location.href.replace("" + location.hash, ''),
    scope: 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    approval_prompt: 'auto'
  };

  google_oauth_url = function() {
    return "https://accounts.google.com/o/oauth2/auth?" + ($.param(google_oauth_parameters_for_fusion_tables));
  };

  parse_query_string = function(query_string) {
    var m, params, regex;
    if (query_string == null) {
      query_string = location.hash.substring(1);
    }
    params = {};
    if (query_string.length > 0) {
      regex = /([^&=]+)=([^&]*)/g;
      while (m = regex.exec(query_string)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }
    }
    return params;
  };

  expires_in_to_date = function(expires_in) {
    var cookie_expires;
    cookie_expires = new Date;
    cookie_expires.setTime(cookie_expires.getTime() + expires_in * 1000);
    return cookie_expires;
  };

  set_cookie = function(key, value, expires_in) {
    var cookie;
    cookie = "" + key + "=" + value + "; ";
    cookie += "expires=" + (expires_in_to_date(expires_in).toUTCString()) + "; ";
    cookie += "path=" + (window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1));
    return document.cookie = cookie;
  };

  delete_cookie = function(key) {
    return set_cookie(key, null, -1);
  };

  get_cookie = function(key) {
    var cookie_fragment, _i, _len, _ref;
    key += "=";
    _ref = document.cookie.split(';');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cookie_fragment = _ref[_i];
      cookie_fragment = cookie_fragment.replace(/^\s+/, '');
      if (cookie_fragment.indexOf(key) === 0) {
        return cookie_fragment.substring(key.length, cookie_fragment.length);
      }
    }
    return null;
  };

  check_table_access = function(table_id, callback) {
    if (get_cookie('access_token')) {
      return $.ajax("" + FUSION_TABLES_URI + "/tables/" + table_id + "?access_token=" + (get_cookie('access_token')), {
        type: 'GET',
        dataType: 'json',
        crossDomain: true,
        error: function(jqXHR, textStatus, errorThrown) {
          return console.log("AJAX Error: " + textStatus);
        },
        success: function(data) {
          return console.log(data);
        },
        complete: function(jqXHR, textStatus) {
          if (callback != null) {
            return callback();
          }
        }
      });
    }
  };

  fusion_tables_escape = function(value) {
    return "'" + (value.replace(/'/g, "\\\'")) + "'";
  };

  fusion_tables_query = function(query, callback) {
    console.log("Query: " + query);
    switch (query.split(' ')[0]) {
      case 'INSERT':
        return $.ajax("" + FUSION_TABLES_URI + "/query?access_token=" + (get_cookie('access_token')), {
          type: 'POST',
          dataType: 'json',
          crossDomain: true,
          data: {
            sql: query
          },
          error: function(jqXHR, textStatus, errorThrown) {
            return console.log("AJAX Error: " + textStatus);
          },
          success: function(data) {
            console.log(data);
            if (callback != null) {
              return callback(data);
            }
          }
        });
      case 'SELECT':
        return $.ajax("" + FUSION_TABLES_URI + "/query?sql=" + query + "&access_token=" + (get_cookie('access_token')), {
          type: 'GET',
          cache: false,
          dataType: 'json',
          crossDomain: true,
          error: function(jqXHR, textStatus, errorThrown) {
            return console.log("AJAX Error: " + textStatus);
          },
          success: function(data) {
            console.log(data);
            if (callback != null) {
              return callback(data);
            }
          }
        });
    }
  };

  filter_url_params = function(params, filtered_params) {
    var hash_string, key, rewritten_params, value;
    rewritten_params = [];
    if (filtered_params == null) {
      filtered_params = ['access_token', 'expires_in', 'token_type'];
    }
    for (key in params) {
      value = params[key];
      if (!_.include(filtered_params, key)) {
        rewritten_params.push("" + key + "=" + value);
      }
    }
    if (rewritten_params.length > 0) {
      hash_string = "#" + (rewritten_params.join('&'));
    } else {
      hash_string = '';
    }
    history.replaceState(null, '', window.location.href.replace("" + location.hash, hash_string));
    return params;
  };

  set_cookie_expiration_callback = function() {
    var expires_in;
    if (get_cookie('access_token_expires_at')) {
      expires_in = get_cookie('access_token_expires_at') - (new Date()).getTime();
      console.log(expires_in);
      return setTimeout((function() {
        console.log("cookie expired");
        return window.location.reload();
      }), expires_in);
    }
  };

  set_access_token_cookie = function(params, callback) {
    if (params['state'] != null) {
      console.log("Replacing hash with state: " + params['state']);
      history.replaceState(null, '', window.location.href.replace("" + location.hash, "#" + params['state']));
    }
    if (params['access_token'] != null) {
      return $.ajax("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + params['access_token'], {
        type: 'GET',
        dataType: 'json',
        crossDomain: true,
        error: function(jqXHR, textStatus, errorThrown) {
          return console.log("Access Token Validation Error: " + textStatus);
        },
        success: function(data) {
          set_cookie('access_token', params['access_token'], params['expires_in']);
          return set_cookie('access_token_expires_at', expires_in_to_date(params['expires_in']).getTime(), params['expires_in']);
        },
        complete: function(jqXHR, textStatus) {
          if (callback != null) {
            return callback(params);
          }
        }
      });
    } else {
      if (callback != null) {
        return callback(params);
      }
    }
  };

  set_author_name = function(callback) {
    if (get_cookie('author_name')) {
      if (callback != null) {
        return callback();
      }
    } else if (get_cookie('access_token')) {
      return $.ajax("https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + (get_cookie('access_token')), {
        type: 'GET',
        dataType: 'json',
        crossDomain: true,
        error: function(jqXHR, textStatus, errorThrown) {
          return console.log("AJAX Error: " + textStatus);
        },
        success: function(data) {
          return set_cookie('author_name', "" + data['name'] + " <" + data['email'] + ">", 3600);
        },
        complete: function(jqXHR, textStatus) {
          if (callback != null) {
            return callback();
          }
        }
      });
    }
  };

  add_related_url = function(url, group) {
    var gazcomp_url, related_link, url1, url2;
    console.log(group + ": " + url);
    url1 = group === 1 ? window.gaz.g1.data.id : url;
    url2 = group === 2 ? window.gaz.g2.data.id : url;
    gazcomp_url = window.location.href.replace("" + location.hash, '') + '#url1=' + url1 + '&url2=' + url2;
    related_link = $('<a>').attr('href', gazcomp_url).attr('target', '_blank').append(url);
    return $(".g" + group + " > div.key:contains(related)").siblings('div.val').first().append(related_link);
  };

  load_related_urls = function(url, other_url, group) {
    var other_group;
    other_group = group === 1 ? 2 : 1;
    return fusion_tables_query("SELECT url" + other_group + " FROM " + gazcomp_config.worklist_fusion_table_id + " WHERE url" + group + " = " + (fusion_tables_escape(url)) + " AND url" + other_group + " NOT EQUAL TO " + (fusion_tables_escape(other_url)), function(fusion_tables_result) {
      var _i, _len, _ref, _results;
      console.log('related urls');
      if (fusion_tables_result.rows != null) {
        _ref = fusion_tables_result.rows;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          url = _ref[_i];
          _results.push(add_related_url(url[0], group));
        }
        return _results;
      }
    });
  };

  load_gazcomp_pair = function(url1, url2) {
    return window.gaz.compare(gazComp.URLData(url1), gazComp.URLData(url2), function() {
      console.log("ready: " + url1 + ", " + url2);
      load_related_urls(url1, url2, 1);
      return load_related_urls(url2, url1, 2);
    });
  };

  get_next_gazcomp_pair = function() {
    return fusion_tables_query("SELECT COUNT() FROM " + gazcomp_config.worklist_fusion_table_id, function(fusion_tables_result) {
      var random_offset, row_count;
      row_count = fusion_tables_result.rows[0][0];
      random_offset = Math.floor(Math.random() * row_count);
      return fusion_tables_query("SELECT url1, url2 FROM " + gazcomp_config.worklist_fusion_table_id + " OFFSET " + random_offset + " LIMIT 1", function(fusion_tables_result) {
        var url1, url2,
          _this = this;
        url1 = fusion_tables_result.rows[0][0];
        url2 = fusion_tables_result.rows[0][1];
        return fusion_tables_query("SELECT COUNT() FROM " + gazcomp_config.votes_fusion_table_id + " WHERE url1 = " + (fusion_tables_escape(url1)) + " AND url2 = " + (fusion_tables_escape(url2)) + " AND choice NOT EQUAL TO 'skip'", function(fusion_tables_result) {
          if ((fusion_tables_result.rows == null) || fusion_tables_result.rows[0][0] === "0") {
            return load_gazcomp_pair(url1, url2);
          } else {
            return get_next_gazcomp_pair();
          }
        });
      });
    });
  };

  process_gazcomp_result = function(g1, g2, choice) {
    console.log("process_gazcomp_result:");
    console.log(g1);
    console.log(g2);
    console.log(choice);
    return fusion_tables_query("INSERT INTO " + gazcomp_config.votes_fusion_table_id + " (url1, url2, choice, author, date) VALUES (" + (fusion_tables_escape(g1)) + ", " + (fusion_tables_escape(g2)) + ", " + (fusion_tables_escape(choice)) + ", " + (fusion_tables_escape(get_cookie('author_name'))) + ", " + (fusion_tables_escape((new Date).toISOString())) + ")", function(fusion_tables_result) {
      return get_next_gazcomp_pair();
    });
  };

  build_gazcomp_driver = function(params) {
    if (get_cookie('access_token')) {
      return set_author_name(function() {
        set_cookie_expiration_callback();
        window.gaz = new gazComp.App(process_gazcomp_result);
        if ((params['url1'] != null) && (params['url2'] != null)) {
          return load_gazcomp_pair(params['url1'], params['url2']);
        } else {
          return get_next_gazcomp_pair();
        }
      });
    } else {
      $('body').append($('<div>').attr('class', 'alert alert-warning').attr('id', 'oauth_access_warning').append('You have not authorized this application to access your Google Fusion Tables. '));
      return $('#oauth_access_warning').append($('<a>').attr('href', google_oauth_url()).append('Click here to authorize.'));
    }
  };

  $(document).ready(function() {
    if (window.FUSION_TABLES_URI != null) {
      FUSION_TABLES_URI = window.FUSION_TABLES_URI;
    }
    gazcomp_config = $.extend({}, default_gazcomp_config, window.gazcomp_config);
    google_oauth_parameters_for_fusion_tables['client_id'] = gazcomp_config['google_client_id'];
    return set_access_token_cookie(filter_url_params(parse_query_string()), build_gazcomp_driver);
  });

}).call(this);
