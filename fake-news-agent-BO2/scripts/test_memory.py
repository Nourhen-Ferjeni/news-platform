from agents.memory_manager import init_db, save_memory, search_memory

init_db()
save_memory("The Earth is flat", "False", 0.98, ["NASA", "Wikipedia"])
print(search_memory("The Earth is flat"))
