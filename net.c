#include "net.h"

#include <errno.h>
#include <netdb.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

static void net_set_error(char *err, const char *fmt, ...) {
  if (!err)
    return;
  va_list ap;
  va_start(ap, fmt);
  vsnprintf(err, 256, fmt, ap);
  va_end(ap);
}

// TODO: IPv6待完成
static int _net_tcp_server(char *err, int port, char *bind_addr, int af,
                           int backlog) {
  int s = -1;
  int rc;
  char _port[6];
  struct addrinfo *listp, *p, hints;
  snprintf(_port, 6, "%d", port);
  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_INET;
  hints.ai_socktype = SOCK_STREAM;
  if ((rc = getaddrinfo(bind_addr, _port, &hints, &listp)) != 0) {
    net_set_error(err, "[_net_tcp_server getaddrinfo] %s", gai_strerror(rc));
    return -1;
  }
  for (p = listp; p; p = listp->ai_next) {
    if ((s = socket(p->ai_family, p->ai_socktype, p->ai_protocol)) == -1) {
      continue;
    }
    if ((rc = bind(s, p->ai_addr, p->ai_addrlen)) == -1) {
      net_set_error(err, "[_net_tcp_server bind] %d %s", errno,
                    strerror(errno));
      goto error;
    }
    if ((rc = listen(s, backlog)) == -1) {
      net_set_error(err, "[_net_tcp_server listen] %d %s", errno,
                    strerror(errno));
      goto error;
    }
    goto end;
  }

error:
  close(s);
  s = -1;

end:
  freeaddrinfo(listp);
  return s;
}

int net_tcp_server(char *err, int port, char *bind_addr, int backlog) {
  return _net_tcp_server(err, port, bind_addr, AF_INET, backlog);
}
