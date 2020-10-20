#ifndef _REQUEST_H_
#define _REQUEST_H_

#include "util/map.h"

/*
 * Method SP Request-URI SP HTTP-Version CRLF
 */
typedef struct {
  char *method;
  char *request_url;
  char *version; // http 0.9 doesn't necessarily need
  map* headers;
} http_request;

#endif /* _REQUEST_H_ */
