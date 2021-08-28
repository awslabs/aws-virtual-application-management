# Thrift DLL
https://aws.amazon.com/blogs/desktop-and-application-streaming/create-a-powershell-based-dynamic-app-provider-in-amazon-appstream-2-0/ for thrift dll

# Scheduled task idea
https://aws.amazon.com/blogs/desktop-and-application-streaming/bring-your-app-v-packages-to-appstream-2-0-with-the-dynamic-application-framework/

eedap_setup.xml is a scheduled task that just sends an event on session logon (implemented in script_setup.ps1) for a named log group (EEDAP)

eedap.xml describes a task that is triggered by the event mentioned above. given the available info at logon time, which is essentially just the current stack name, it pulls down the dynamic catalog correlation file for the stack.  This file is meant to be overwritten by the latest click from a particular user through to a dyncat instance. The correlation file points to a dynamic catalog, which in turn points to applications within the application repo. This represent the applications that are supposed to be presented to the current user given this stack and latest usage context. Each application is registered with the instance at this point, just before the user sees the app list.
