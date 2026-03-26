import json

def get_rows(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    result_text = data['result']
    # Extract content between <untrusted-data-*> and </untrusted-data-*>
    start_marker = '<untrusted-data-'
    end_marker = '</untrusted-data-'
    
    start_idx = result_text.find(start_marker)
    if start_idx == -1:
        return []
    
    # Find the end of the first line (the marker line)
    line_end = result_text.find('\n', start_idx)
    content_start = line_end + 1
    
    end_idx = result_text.find(end_marker, content_start)
    json_text = result_text[content_start:end_idx].strip()
    
    return json.loads(json_text)

def generate_insert_steps(rows):
    values = []
    for row in rows:
        task_id = f"'{row['task_id']}'"
        label = f"'{row['label'].replace('\'', '\'\'')}'"
        action = f"'{row['action'].replace('\'', '\'\'')}'"
        status = f"'{row['status']}'"
        result = f"'{str(row['result']).replace('\'', '\'\'')}'" if row['result'] else 'NULL'
        order_index = row['order_index']
        created_at = f"'{row['created_at']}'"
        tool_name = f"'{row['tool_name']}'" if row['tool_name'] else 'NULL'
        tool_input = f"'{str(row['tool_input']).replace('\'', '\'\'')}'" if row['tool_input'] else 'NULL'
        
        values.append(f"({task_id}, {label}, {action}, {status}, {result}, {order_index}, {created_at}, {tool_name}, {tool_input})")
    
    return f"INSERT INTO public.agent_steps (task_id, label, action, status, result, order_index, created_at, tool_name, tool_input) VALUES \n" + ",\n".join(values) + ";"

def generate_insert_results(rows):
    values = []
    for row in rows:
        task_id = f"'{row['task_id']}'"
        tool_name = f"'{row['tool_name']}'"
        parameters = f"'{json.dumps(row['parameters']).replace('\'', '\'\'')}'" if row['parameters'] else 'NULL'
        output = f"'{str(row['output']).replace('\'', '\'\'')}'" if row['output'] else 'NULL'
        success = str(row['success']).lower()
        created_at = f"'{row['created_at']}'"
        
        values.append(f"({task_id}, {tool_name}, {parameters}, {output}, {success}, {created_at})")
    
    return f"INSERT INTO public.agent_tool_results (task_id, tool_name, parameters, output, success, created_at) VALUES \n" + ",\n".join(values) + ";"

# Step 67: agent_steps
print("--- STEPS ---")
steps_rows = get_rows('C:/Users/shibu/.gemini/antigravity/brain/705c8434-4709-4456-a71d-ac4d459282f8/.system_generated/steps/60/output.txt')
if steps_rows:
    print(generate_insert_steps(steps_rows))

print("\n--- RESULTS ---")
results_rows = get_rows('C:/Users/shibu/.gemini/antigravity/brain/705c8434-4709-4456-a71d-ac4d459282f8/.system_generated/steps/61/output.txt')
if results_rows:
    print(generate_insert_results(results_rows))
