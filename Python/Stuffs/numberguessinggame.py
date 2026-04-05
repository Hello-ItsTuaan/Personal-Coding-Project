import random

# ===== PLAYER =====
player = {
    "hp": 100,
    "attack": 10,
    "level": 1
}

# ===== ENEMY =====
def create_enemy():
    return {
        "hp": random.randint(20, 50),
        "attack": random.randint(5, 15)
    }

# ===== FIGHT =====
def fight(player, enemy):
    print("\n⚔️ Một con quái xuất hiện!")

    while player["hp"] > 0 and enemy["hp"] > 0:
        print(f"\n❤️ HP bạn: {player['hp']}")
        print(f"👹 HP quái: {enemy['hp']}")

        action = input("Chọn hành động (attack/run): ")

        if action == "attack":
            damage = player["attack"]
            enemy["hp"] -= damage
            print(f"Bạn gây {damage} damage!")

        elif action == "run":
            print("Bạn chạy mất dép 💀")
            return False

        # enemy đánh lại
        if enemy["hp"] > 0:
            dmg = enemy["attack"]
            player["hp"] -= dmg
            print(f"Quái đánh bạn {dmg} damage!")

    if player["hp"] > 0:
        print("🎉 Bạn thắng!")
        return True
    else:
        print("💀 Game Over")
        return False


# ===== MAIN LOOP =====
while True:
    enemy = create_enemy()

    win = fight(player, enemy)

    if not win:
        break

    # reward
    player["level"] += 1
    player["hp"] += 20
    player["attack"] += 2

    print(f"🔥 Level up! Level hiện tại: {player['level']}")