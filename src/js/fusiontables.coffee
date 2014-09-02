FUSION_TABLES_URI = 'https://www.googleapis.com/fusiontables/v1'

default_gazcomp_config =
  google_client_id: '69738617359-b0v88ji0eih9h06kdn9v8nvmlenm054e.apps.googleusercontent.com'

google_oauth_parameters_for_fusion_tables =
  response_type: 'token'
  redirect_uri: window.location.href.replace("#{location.hash}",'')
  scope: 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
  approval_prompt: 'auto'

google_oauth_url = ->
  "https://accounts.google.com/o/oauth2/auth?#{$.param(google_oauth_parameters_for_fusion_tables)}"

# parse URL hash parameters into an associative array object
parse_query_string = (query_string) ->
  query_string ?= location.hash.substring(1)
  params = {}
  if query_string.length > 0
    regex = /([^&=]+)=([^&]*)/g
    while m = regex.exec(query_string)
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2])
  return params

expires_in_to_date = (expires_in) ->
  cookie_expires = new Date
  cookie_expires.setTime(cookie_expires.getTime() + expires_in * 1000)
  return cookie_expires

set_cookie = (key, value, expires_in) ->
  cookie = "#{key}=#{value}; "
  cookie += "expires=#{expires_in_to_date(expires_in).toUTCString()}; "
  cookie += "path=#{window.location.pathname.substring(0,window.location.pathname.lastIndexOf('/')+1)}"
  document.cookie = cookie

delete_cookie = (key) ->
  set_cookie key, null, -1

get_cookie = (key) ->
  key += "="
  for cookie_fragment in document.cookie.split(';')
    cookie_fragment = cookie_fragment.replace(/^\s+/, '')
    return cookie_fragment.substring(key.length, cookie_fragment.length) if cookie_fragment.indexOf(key) == 0
  return null

check_table_access = (table_id, callback) ->
  # test table access
  if get_cookie 'access_token'
    $.ajax "#{FUSION_TABLES_URI}/tables/#{table_id}?access_token=#{get_cookie 'access_token'}",
      type: 'GET'
      dataType: 'json'
      crossDomain: true
      error: (jqXHR, textStatus, errorThrown) ->
        console.log "AJAX Error: #{textStatus}"
        $('.container > h1').after $('<div>').attr('class','alert alert-error').attr('id','collection_access_error').append('You do not have permission to access this collection.')
        disable_collection_form()
      success: (data) ->
        console.log data
      complete: (jqXHR, textStatus) ->
        callback() if callback?

# wrap values in single quotes and backslash-escape single-quotes
fusion_tables_escape = (value) ->
  "'#{value.replace(/'/g,"\\\'")}'"

fusion_tables_query = (query, callback) ->
  console.log "Query: #{query}"
  switch query.split(' ')[0]
    when 'INSERT'
      $.ajax "#{FUSION_TABLES_URI}/query?access_token=#{get_cookie 'access_token'}",
        type: 'POST'
        dataType: 'json'
        crossDomain: true
        data:
          sql: query
        error: (jqXHR, textStatus, errorThrown) ->
          console.log "AJAX Error: #{textStatus}"
          $('#collection_form').after $('<div>').attr('class','alert alert-error').attr('id','submit_error').append("Error submitting data: #{textStatus}")
          scroll_to_bottom()
          $('#submit_error').delay(1800).fadeOut 1800, ->
            $(this).remove()
            $('#collection_select').change()
        success: (data) ->
          console.log data
          if callback?
            callback(data)
    when 'SELECT'
      $.ajax "#{FUSION_TABLES_URI}/query?sql=#{query}&access_token=#{get_cookie 'access_token'}",
        type: 'GET'
        cache: false
        dataType: 'json'
        crossDomain: true
        error: (jqXHR, textStatus, errorThrown) ->
          console.log "AJAX Error: #{textStatus}"
        success: (data) ->
          console.log data
          if callback?
            callback(data)

# filter URL parameters out of the window URL using replaceState 
# returns the original parameters
filter_url_params = (params, filtered_params) ->
  rewritten_params = []
  filtered_params ?= ['access_token','expires_in','token_type']
  for key, value of params
    unless _.include(filtered_params,key)
      rewritten_params.push "#{key}=#{value}"
  if rewritten_params.length > 0
    hash_string = "##{rewritten_params.join('&')}"
  else
    hash_string = ''
  history.replaceState(null,'',window.location.href.replace("#{location.hash}",hash_string))
  return params

# write a Google OAuth access token into a cached cookie that should expire when the access token does
set_access_token_cookie = (params, callback) ->
  if params['state']?
    console.log "Replacing hash with state: #{params['state']}"
    history.replaceState(null,'',window.location.href.replace("#{location.hash}","##{params['state']}"))
  if params['access_token']?
    # validate the token per https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
    $.ajax "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=#{params['access_token']}",
      type: 'GET'
      dataType: 'json'
      crossDomain: true
      error: (jqXHR, textStatus, errorThrown) ->
        console.log "Access Token Validation Error: #{textStatus}"
      success: (data) ->
        set_cookie('access_token',params['access_token'],params['expires_in'])
        set_cookie('access_token_expires_at',expires_in_to_date(params['expires_in']).getTime(),params['expires_in'])
        $('#collection_select').change()
      complete: (jqXHR, textStatus) ->
        callback() if callback?

# set the author name using Google profile information
set_author_name = (callback) ->
  if get_cookie 'author_name'
    # $('input[data-type=authuser]').attr('value',get_cookie 'author_name')
    # $('input[data-type=authuser]').prop('disabled',true)
  else if get_cookie 'access_token'
    $.ajax "https://www.googleapis.com/oauth2/v1/userinfo?access_token=#{get_cookie 'access_token'}",
      type: 'GET'
      dataType: 'json'
      crossDomain: true
      error: (jqXHR, textStatus, errorThrown) ->
        console.log "AJAX Error: #{textStatus}"
        # $('.container > h1').after $('<div>').attr('class','alert alert-warning').append('Error retrieving profile info.')
      success: (data) ->
        set_cookie('author_name',"#{data['name']} <#{data['email']}>",3600)
        # $('input[data-type=authuser]').attr('value',get_cookie('author_name'))
        # $('input[data-type=authuser]').prop('disabled',true)
      complete: (jqXHR, textStatus) ->
        callback() if callback?

get_next_gazcomp_pair = ->
  return [gazComp.URLData('http://pleiades.stoa.org/places/109126'),gazComp.URLData('http://sws.geonames.org/2988507/')]

process_gazcomp_result = (g1, g2, choice) ->
  console.log("process_gazcomp_result:")
  console.log(g1)
  console.log(g2)
  console.log(choice)
  window.gaz.compare(get_next_gazcomp_pair()...)

build_gazcomp_driver = ->
    if get_cookie 'access_token'
      window.gaz = new gazComp.App( process_gazcomp_result )
      window.gaz.compare( gazComp.URLData( 'http://sws.geonames.org/8015037/' ), gazComp.URLData( 'http://pleiades.stoa.org/places/999196280' ) )
    else
      $('body').append $('<div>').attr('class','alert alert-warning').attr('id','oauth_access_warning').append('You have not authorized this application to access your Google Fusion Tables. ')
      $('#oauth_access_warning').append $('<a>').attr('href',google_oauth_url()).append('Click here to authorize.')
      # disable_collection_form()

$(document).ready ->  
  google_oauth_parameters_for_fusion_tables['client_id'] = default_gazcomp_config['google_client_id']

  set_access_token_cookie filter_url_params(parse_query_string())

  build_gazcomp_driver()