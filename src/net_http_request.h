#ifndef _NET_HTTP_REQUEST_H_
#define _NET_HTTP_REQUEST_H_

#include "util_map.h"

/*
 * Method SP Request-URI SP HTTP-Version CRLF
 */
typedef struct {
    char *method;
    char *request_url;
    char *version;  // http 0.9 doesn't necessarily need
    map *headers;
} http_request;

#endif /* _NET_HTTP_REQUEST_H_ */
