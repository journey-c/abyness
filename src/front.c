#include "front.h"
#include "net_tcp.h"

#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>

void *front_listen(char *addr, int port) {
    char err[256];
    tcp_listener *l = net_tcp_listen(err, addr, port, 511);
    if (!l) {
        printf("[front_listen] listen error: %s\n", err);
        exit(-1);
    }
    printf("[front_listen] listen 8360\n");

    for (;;) {
        tcp_conn *conn = net_tcp_accept(err, l);
        if (!conn) {
            printf("[front_listen] accept error: %s\n", err);
            break;
        }
        printf("new conn: %d\n", conn->fd);
    }
    return NULL;
}
