export const enum RandomGroup {
	General = 0,
	Rewards = 1,
	Shop = 2,
	ShopRoll = 3,
	Create = 4,
}

const RANDOM_GROUP_COUNT = 5;

// Based on RandomManager from decompiled Zoominoes source code
export class RandomManager {
	readonly randomsByGroup: Random[];

	constructor(seed: string) {
        if (seed === '') {
            throw new Error('Empty seed is not allowed');
        }
        let seedNum = getHashCode(seed);
        this.randomsByGroup = [];
		for (let i = 0; i < RANDOM_GROUP_COUNT; i++) {
            this.randomsByGroup.push(new Random(seedNum));
            seedNum += 1;
        }
	}

	next(minInclusive: number, maxExclusive: number, group: RandomGroup) {
		return this.randomsByGroup[group].next(minInclusive, maxExclusive);
	}

	shuffleList<T>(list: T[], group: RandomGroup) {
		let num = list.length;
		while (num > 1) {
			num--;
			const index = this.next(0, num + 1, group);
			const value = list[index];
			list[index] = list[num];
			list[num] = value;
		}
	}

    emulateShuffleList(length: number, group: RandomGroup) {
		let num = length;
		while (num > 1) {
			num--;
			this.next(0, num + 1, group);
		}
	}

	randomFromList<T>(list: T[], group: RandomGroup) {
        if (list.length === 0) {
            throw new Error("Attempt to get random element from empty list");
        }
		return list[this.next(0, list.length, group)];
	}
}

const INT_MIN_VALUE = -2147483648;
const INT_MAX_VALUE = 2147483647;

// Based on https://github.com/dotnet/dotnet/blob/main/src/runtime/src/libraries/System.Private.CoreLib/src/System/Random.CompatImpl.cs
export class Random {
    _seed: number;
    _seedArray: number[];
    _inext: number;
    _inextp: number;

    constructor(seed: number) {
        this._seed = seed;
        this._seedArray = [];
        this._inext = 0;
        this._inextp = 21;
    }

    next(minValue: number, maxValue: number) {
        if (this._seedArray.length === 0) {
            // Seed array init is slow, so we only do it when the RNG is actually used.

            const seedArray = Array(56).fill(0);

            const subtraction = (this._seed == INT_MIN_VALUE) ? INT_MAX_VALUE : Math.abs(this._seed);
            let mj = 161803398 - subtraction; // magic number based on Phi (golden ratio)
            seedArray[55] = mj;
            let mk = 1;

            let ii = 0;
            for (let i = 1; i < 55; i++) {
                // The range [1..55] is special (Knuth) and so we're wasting the 0'th position.
                if ((ii += 21) >= 55) {
                    ii -= 55;
                }

                seedArray[ii] = mk;
                mk = mj - mk;
                if (mk < 0) {
                    mk += INT_MAX_VALUE;
                }

                mj = seedArray[ii];
            }

            for (let k = 1; k < 5; k++) {
                for (let i = 1; i < 56; i++) {
                    let n = i + 30;
                    if (n >= 55) {
                        n -= 55;
                    }

                    seedArray[i] -= seedArray[1 + n];
                    if (seedArray[i] < 0) {
                        seedArray[i] += INT_MAX_VALUE;
                    }
                }
            }

            this._seedArray = seedArray;
        }

        const range = maxValue - minValue;
        if (range > INT_MAX_VALUE) {
            throw new Error("Random number range too large");
        }
        
        let locINext = this._inext;
        if (++locINext >= 56) {
            locINext = 1;
        }

        let locINextp = this._inextp;
        if (++locINextp >= 56) {
            locINextp = 1;
        }

        const seedArray = this._seedArray;
        let retVal = (seedArray[locINext] - seedArray[locINextp]) | 0;

        if (retVal == INT_MAX_VALUE) {
            retVal--;
        }
        if (retVal < 0) {
            retVal += INT_MAX_VALUE;
        }

        seedArray[locINext] = retVal;
        this._inext = locINext;
        this._inextp = locINextp;

        const sample = retVal * (1.0 / INT_MAX_VALUE);

        return Math.trunc(sample * range) + minValue;
    }
}

export function getRandomSeed(length: number) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let seed = '';
    for (let i = 0; i < length; i++) {
        seed += characters.charAt(Math.random() * characters.length);
    }
    return seed;
}

// Based on String.GetHashCode implementation from decompiled mscorlib.dll included in Zoominoes
export function getHashCode(string: string) {
    let num1 = 5381;
    let num2 = num1;
    for (let i = 0; i < string.length; i += 2)
    {
        const char1 = string.charCodeAt(i);
        num1 = (num1 << 5) + num1 ^ char1;
        if (i + 1 < string.length) {
            const char2 = string.charCodeAt(i + 1)
            num2 = (num2 << 5) + num2 ^ char2;
        }
    }
    return (num1 + Math.imul(num2, 1566083941)) | 0;
}
