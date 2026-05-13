import json

filename = "test.json"

def load_data(filename):
    
    
    try: 
        with open(filename, "r") as r: 
            loaded = json.load(r)
    except FileNotFoundError:
        loaded = []

    return loaded




def save_data(filename, data):
    with open(filename, "w") as w:
        json.dump(data, w, indent= 4)

        

