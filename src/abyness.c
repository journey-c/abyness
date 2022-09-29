#include <ayn_core.h>

int main(int argc, char **argv)
{
	struct ayn_conf *cf = malloc(sizeof(struct ayn_conf));
	ayn_conf_parse(
		cf,
		"/home/lvcheng.journeyc/repo/journey-c/abyness/abyness.conf");
	return 0;
}
