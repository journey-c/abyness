CC          := cc
LIB_FLAGS   := -c
FLAGS       := -std=gnu99 -Wall
# FLAGS       := -std=gnu99 -Wall -O2
OBJECT      := lyuling
LIB         := -lpthread

BINARY      =  bin
INCLUDE     := -Iinclude

SOURCE_FILE = $(wildcard *.c)
OBJS        = $(patsubst %.c, %.o, $(SOURCE_FILE))

CCCOLOR     = "\033[34m" 
LINKCOLOR   = "\033[34;1m" 
SRCCOLOR    = "\033[33m" 
BINCOLOR    = "\033[37;1m" 
MAKECOLOR   = "\033[32;1m" 
ENDCOLOR    = "\033[0m"

ALL : $(OBJECT)
	@rm -rf $(BINARY)
	@mkdir -p $(BINARY)
	@mv $(OBJECT) $(BINARY)
	@printf '%b %b %b %b\n' $(CCCOLOR)LINK$(ENDCOLOR) $(BINCOLOR)$(OBJECT)$(ENDCOLOR)

$(OBJECT) : $(OBJS)
	@$(CC) $(FLAGS) $(INCLUDE) -o $(OBJECT) $(OBJS) $(LIBRARY) $(LIB)
	@printf '%b %b %b %b %b %b\n' $(CCCOLOR)CC$(ENDCOLOR) $(SRCCOLOR)$(notdir $<)$(ENDCOLOR)

$(OBJS) : %.o : %.c
	$(CC) $(LIB_FLAGS) $(FLAGS) $(INCLUDE) -o $@ $<

test :
ifeq ($(unit),)
	@printf '%b %b\n  %b %b %b %b\n' $(BINCOLOR)Usage:$(ENDCOLOR) $(MAKECOLOR)make test unit=net$(ENDCOLOR)
else 
	@$(CC) $(FLAGS) -g $(INCLUDE) -o $(unit) $(subst main.c,,$(SOURCE_FILE)) test/$(unit)_test.c
	@printf '%b %b %b %b %b\n' $(MAKECOLOR)=== TEST RUN ===$(ENDCOLOR)
	@./$(unit)
	@rm -f $(unit)
	@printf '%b %b %b %b %b\n' $(MAKECOLOR)=== TEST END ===$(ENDCOLOR)
endif

clean :
	@rm -f *.o && printf '%b %b %b %b\n' $(CCCOLOR)CLEAN$(ENDCOLOR) $(SRCCOLOR)*.o$(ENDCOLOR)
	@rm -rf $(BINARY) && printf '%b %b %b %b\n' $(CCCOLOR)CLEAN$(ENDCOLOR) $(SRCCOLOR)bin$(ENDCOLOR)
	@rm -f core* && printf '%b %b %b %b\n' $(CCCOLOR)CLEAN$(ENDCOLOR) $(SRCCOLOR)core*$(ENDCOLOR)

.PHONY : clean test
