#include <ayn_core.h>
#include <stdlib.h>

int main(int argc, char **argv)
{
	struct ayn_config *cf = malloc(sizeof(struct ayn_config));
	ayn_conf_parse(
		cf,
		"/home/lvcheng.journeyc/repo/journey-c/abyness/abyness.conf");
	return 0;
}
