export function practiceGesture(skill) { if (['woodcutting', 'mining', 'smithing', 'attack'].includes(skill))
    return 'chop'; if (skill === 'strength' || skill === 'defence' || skill === 'hitpoints')
    return 'brace'; if (skill === 'ranged' || skill === 'fishing')
    return 'aim'; if (skill === 'magic' || skill === 'prayer' || skill === 'runecrafting')
    return 'focus'; if (skill === 'agility')
    return 'balance'; return 'play'; }
