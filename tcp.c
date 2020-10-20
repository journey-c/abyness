#include "net/tcp.h"
#include "net/net_define.h"

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
  vsnprintf(err, ERROR_MAX, fmt, ap);
  va_end(ap);
}

// TODO: IPv6待完成
static tcp_listener *_net_tcp_server(char *err, char *bind_addr, int port,
                                     int af, int backlog) {
  tcp_listener *tl = (tcp_listener *)malloc(sizeof(tcp_listener));
  tl->fd = NET_ERR;

  int rc;
  char _port[6];
  struct addrinfo *listp, *p, hints;
  snprintf(_port, 6, "%d", port);
  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_INET;
  hints.ai_socktype = SOCK_STREAM;
  if ((rc = getaddrinfo(bind_addr, _port, &hints, &listp)) != 0) {
    net_set_error(err, "[_net_tcp_server getaddrinfo] %s", gai_strerror(rc));
    return NULL;
  }
  for (p = listp; p; p = listp->ai_next) {
    if ((tl->fd = socket(p->ai_family, p->ai_socktype, p->ai_protocol)) == -1) {
      continue;
    }
    if ((rc = bind(tl->fd, p->ai_addr, p->ai_addrlen)) == -1) {
      net_set_error(err, "[_net_tcp_server bind] %d %s", errno,
                    strerror(errno));
      goto error;
    }
    if ((rc = listen(tl->fd, backlog)) == -1) {
      net_set_error(err, "[_net_tcp_server listen] %d %s", errno,
                    strerror(errno));
      goto error;
    }

    tl->ai_addr = p->ai_addr;
    tl->ai_addrlen = p->ai_addrlen;
    goto end;
  }

error:
  close(tl->fd);
  tl->fd = NET_ERR;

end:
  freeaddrinfo(listp);
  return tl;
}

tcp_conn *net_tcp_accept(char *err, tcp_listener *tl) {
  int fd = accept(tl->fd, tl->ai_addr, &tl->ai_addrlen);
  if (fd == NET_ERR) {
    net_set_error(err, "[net_tcp_accept accept] %d %s", errno, strerror(errno));
    return NULL;
  }
  tcp_conn *conn = (tcp_conn *)malloc(sizeof(tcp_conn));
  conn->fd = fd;
  return conn;
}

tcp_listener *net_tcp_listen(char *err, char *bind_addr, int port,
                             int backlog) {
  tcp_listener *tl = _net_tcp_server(err, bind_addr, port, AF_INET, backlog);
  if (!tl) {
    return NULL;
  }
  return tl;
}
