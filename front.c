#include "front.h"
#include "net.h"

#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>

void *front_listen(void * arg) {
  char err[256];
  int listen_fd = net_tcp_server(err, 8360, "0.0.0.0", 5);
  if (listen_fd == -1) {
    printf("[front_listen] listen error: %s\n", err);
    exit(-1);
  }
  printf("[front_listen] listen 8360\n");

  for (;;) {
  }
  return NULL;
}
