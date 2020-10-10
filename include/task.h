#ifndef _TASK_H_
#define _TASK_H_

#include <pthread.h>

extern int create_task(pthread_t *tid, void *func(void *), void *arg);

#endif /* _TASK_H_ */
