#include "task.h"

int create_task(pthread_t *tid, void *func(void *), void *arg) {
  return pthread_create(tid, NULL, func, arg);
}
