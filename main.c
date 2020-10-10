#include "front.h"
#include "task.h"

#include <stdio.h>
#include <unistd.h>

pthread_t fl_tid;

void init() {

}

int main(int argc, char **argv) {
  init();
  create_task(&fl_tid, front_listen, NULL);
  for (int i = 0; i < 100; i ++) {
    sleep(1);
    printf("sleep\t%d s\n", i);
  }
  return 0;
}
