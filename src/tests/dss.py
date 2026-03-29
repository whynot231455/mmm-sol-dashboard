import dataikuapi

# Connect to your DSS instance
client = dataikuapi.DSSClient(
    host="http://localhost:11200",   # Your DSS URL
    api_key="dkuaps-rJRaOoqnagC4z5BWWpYpqAmg9PAwemCn"      # From Profile > API Keys
)

# Get your project
project = client.get_project("MMMDATA")

# Access your managed folder
folder = project.get_managed_folder("HrZX9yO2")

# List files in the folder
contents = folder.list_contents()
print(contents)