#ifndef _TCP_H_
#define _TCP_H_

#include "sys/socket.h"

typedef struct {
  int fd;
} tcp_conn;

typedef struct {
  int fd;
  socklen_t ai_addrlen;
  struct sockaddr *ai_addr;
} tcp_listener;

// ipv4
extern tcp_listener *net_tcp_listen(char *err, char *bind_addr, int port,
                                    int backlog);
extern tcp_conn *net_tcp_accept(char *err, tcp_listener *listener);

#endif /* _TCP_H_ */
