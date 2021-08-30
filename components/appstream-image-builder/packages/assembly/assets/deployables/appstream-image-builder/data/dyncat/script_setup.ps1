Write-EventLog -LogName EEDAP -source ClientRefresh -EntryType Information -eventID 25 -Message "Client Refresh for $env:username has completed successfully." -Verbose
