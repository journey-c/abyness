#ifndef _NET_HTTP_DEFINE_H_
#define _NET_HTTP_DEFINE_H_

#define DEFAULT_VERSION HTTP0_9
#define HTTP0_9 "HTTP/0.9"
#define HTTP1_0 "HTTP/1.0"
#define HTTP1_1 "HTTP/1.1"

// ASCII
#define CR 13
#define LF 10
#define SP 32
#define HT 9  // \t

#define HTTP_METHOD_GET "GET"
#define HTTP_METHOD_HEAD "HEAD"
#define HTTP_METHOD_POST "POST"
#define HTTP_METHOD_PUT "PUT"          // RFC 2068
#define HTTP_METHOD_DELETE "DELETE"    // RFC 2068
#define HTTP_METHOD_TRACE "TRACE"      // RFC 2068
#define HTTP_METHOD_CONNECT "CONNECT"  // RFC 2616

/*
Status-Code    =
            "100"  ; Section 10.1.1: Continue
          | "101"  ; Section 10.1.2: Switching Protocols
          | "200"  ; Section 10.2.1: OK
          | "201"  ; Section 10.2.2: Created
          | "202"  ; Section 10.2.3: Accepted
          | "203"  ; Section 10.2.4: Non-Authoritative Information
          | "204"  ; Section 10.2.5: No Content
          | "205"  ; Section 10.2.6: Reset Content
          | "206"  ; Section 10.2.7: Partial Content
          | "300"  ; Section 10.3.1: Multiple Choices
          | "301"  ; Section 10.3.2: Moved Permanently
          | "302"  ; Section 10.3.3: Found
          | "303"  ; Section 10.3.4: See Other
          | "304"  ; Section 10.3.5: Not Modified
          | "305"  ; Section 10.3.6: Use Proxy
          | "307"  ; Section 10.3.8: Temporary Redirect
          | "400"  ; Section 10.4.1: Bad Request
          | "401"  ; Section 10.4.2: Unauthorized
          | "402"  ; Section 10.4.3: Payment Required
          | "403"  ; Section 10.4.4: Forbidden
          | "404"  ; Section 10.4.5: Not Found
          | "405"  ; Section 10.4.6: Method Not Allowed
          | "406"  ; Section 10.4.7: Not Acceptable
          | "407"  ; Section 10.4.8: Proxy Authentication Required
          | "408"  ; Section 10.4.9: Request Time-out
          | "409"  ; Section 10.4.10: Conflict
          | "410"  ; Section 10.4.11: Gone
          | "411"  ; Section 10.4.12: Length Required
          | "412"  ; Section 10.4.13: Precondition Failed
          | "413"  ; Section 10.4.14: Request Entity Too Large
          | "414"  ; Section 10.4.15: Request-URI Too Large
          | "415"  ; Section 10.4.16: Unsupported Media Type
          | "416"  ; Section 10.4.17: Requested range not satisfiable
          | "417"  ; Section 10.4.18: Expectation Failed
          | "500"  ; Section 10.5.1: Internal Server Error
          | "501"  ; Section 10.5.2: Not Implemented
          | "502"  ; Section 10.5.3: Bad Gateway
          | "503"  ; Section 10.5.4: Service Unavailable
          | "504"  ; Section 10.5.5: Gateway Time-out
          | "505"  ; Section 10.5.6: HTTP Version not supported
 */
// Status-Code
#define HTTP_CONTINUE "100"             // RFC 2068
#define HTTP_SWITCHING_PROTOCOLS "101"  // RFC 2068

#define HTTP_OK "200"
#define HTTP_CREATED "201"
#define HTTP_ACCEPTED "202"
#define HTTP_NON_AUTHORITATIVE_INFORMATION "203"  // RFC 2068
#define HTTP_NO_CONTENT "204"                     // RFC 2068
#define HTTP_RESET_CONTENT "205"                  // RFC 2068
#define HTTP_PARTIAL_CONTENT "206"                // RFC 2068

#define HTTP_MULTIPLE_CHOICES "300"
#define HTTP_MOVED_PERMANCETLY "301"
#define HTTP_FOUND "302"
#define HTTP_SEE_OTHER "303"  // RFC 2068
#define HTTP_NOT_MODIFIED "304"
#define HTTP_USE_PROXY "305"           // RFC 2068
#define HTTP_UNUSED "306"              // RFC 2616
#define HTTP_TEMPORARY_REDIRECT "307"  // RFC 2616

#define HTTP_BAD_REQUEST "400"
#define HTTP_UNAUTHORIZED "401"
#define HTTP_PAYMENT_REQUIRED "402"  // RFC 2068
#define HTTP_FORBIDDEN "403"
#define HTTP_NOT_FOUND "404"
#define HTTP_METHOD_NOT_ALLOWED "405"               // RFC 2068
#define HTTP_NOT_ACCEPTABLE "406"                   // RFC 2068
#define HTTP_PROXY_AUTHENTICATION_REQUIRED "407"    // RFC 2068
#define HTTP_REQUEST_TIMEOUT "408"                  // RFC 2068
#define HTTP_CONFILICT "409"                        // RFC 2068
#define HTTP_GONE "410"                             // RFC 2068
#define HTTP_LENGTH_REQUIRED "411"                  // RFC 2068
#define HTTP_PRECONDITION_FAILED "412"              // RFC 2068
#define HTTP_REQUEST_ENTITY_TOO_LARGE "413"         // RFC 2068
#define HTTP_REQUEST_URL_TOO_LONG "414"             // RFC 2068
#define HTTP_UNSUPPORTED_MEDIA_TYPE "415"           // RFC 2068
#define HTTP_REQUESTED_RANGE_NOT_SATISFIABLE "416"  // RFC 2616
#define HTTP_EXPECTATION_FAILED "417"               // RFC 2616

#define HTTP_INTERNAL_SERVER_ERROR "500"
#define HTTP_NOT_IMPLEMENTED "501"
#define HTTP_BAD_GATEWAY "502"
#define HTTP_SERVICE_UNAVAILABLE "503"
#define HTTP_GATEWAY_TIMEOUT "504"             // RFC 2068
#define HTTP_HTTP_VERSION_NOT_SUPPORTED "505"  // RFC 2068

#endif /* _NET_HTTP_DEFINE_H_ */
