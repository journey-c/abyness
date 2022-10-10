#include "ayn_log.h"
#include <ayn_core.h>

int ayn_show_version;
int ayn_show_help;
char *ayn_conf_file;

int ayn_init_option(int argc, char *const *argv)
{
	char *p;
	int i;
	for (i = 1; i < argc; i++) {
		p = (char *)argv[i];
		if (*p++ != '-') {
			ayn_write_stderr("invalid option" AYN_LINEFEED);
			return -1;
		}
		while (*p) {
			switch (*p++) {
			case '?':
			case 'h':
				ayn_show_version = 1;
				ayn_show_help = 1;
				break;
			case 'v':
				ayn_show_version = 1;
				break;
			case 'c':
				// -c/usr/local/conf
				if (*p) {
					ayn_conf_file = p;
					goto next;
				}
				if (argv[++i]) {
					ayn_conf_file = argv[i];
					goto next;
				}
				ayn_write_stderr(
					"invalid option -c" AYN_LINEFEED);
				return -1;
			default:
				ayn_write_stderr(
					"invalid option -" AYN_LINEFEED);
				return -1;
			}
		}
next:
		continue;
	}
	return 0;
}

void ayn_show_version_info()
{
	ayn_write_stderr("abyness version: " ABYNESS_VERSION AYN_LINEFEED);

	if (ayn_show_help) {
		ayn_write_stderr(
			"Usage: nginx [-?hv] [-c filename]" AYN_LINEFEED
				AYN_LINEFEED "Options:" AYN_LINEFEED
			"  -?,-h         : this help" AYN_LINEFEED
			"  -v            : show version and exit" AYN_LINEFEED
			"  -c filename   : set configuration file (default: " AYN_CON_PATH
			")" AYN_LINEFEED);
	}
}

int main(int argc, char **argv)
{
	ayn_log_stderr(0, "1", "2", "3", "4");
	if (ayn_init_option(argc, argv) == -1) {
		return -1;
	}
	if (ayn_show_version) {
		ayn_show_version_info();
		return 0;
	}
	struct ayn_conf *cf = malloc(sizeof(struct ayn_conf));
	cf->conf_file = malloc(sizeof(struct ayn_file));
	if (ayn_conf_parse(cf, ayn_conf_file) == -1) {
		ayn_write_stderr("parse conf file error\n");
		return -1;
	}
	return 0;
}
