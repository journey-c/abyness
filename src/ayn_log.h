#ifndef _AYN_LOG_H_INCLUDE_
#define _AYN_LOG_H_INCLUDE_

#define AYN_LOG_LEVEL_EMERG 0
#define AYN_LOG_LEVEL_ALERT 1
#define AYN_LOG_LEVEL_CRIT 2
#define AYN_LOG_LEVEL_ERR 3
#define AYN_LOG_LEVEL_WARNING 4
#define AYN_LOG_LEVEL_NOTICE 5
#define AYN_LOG_LEVEL_INFO 6
#define AYN_LOG_LEVEL_DEBUG 7

#define AYN_LOG_MAX_ERROR_STR 2048

struct ayn_log;

typedef void (*ayn_log_writer)(struct ayn_log *log, int log_level, char *buf,
			       int len);

struct ayn_log {
	int log_level;
	struct ayn_file *open_file;
	ayn_log_writer writer;
};

struct ayn_log *ayn_log_init(char *prefix, char *error_log);
int ayn_log_stderr(int errno, const char *fmt, ...);

int ayn_write_stderr(char *text);

#endif /* AYN_LOG_H_INCLUDE_ */
