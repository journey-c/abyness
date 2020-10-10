#ifndef _NET_H_
#define _NET_H_

#include "sys/socket.h"

extern int net_tcp_server(char *err, int port, char *bind_addr, int backlog);

#endif /* _NET_H_ */
