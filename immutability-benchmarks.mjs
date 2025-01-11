/* eslint-disable no-inner-declarations */
//import {measure} from "./measure.mjs"

import {produce as produce2, setAutoFreeze as setAutoFreeze2} from "immer2"
import {produce as produce3, setAutoFreeze as setAutoFreeze3} from "immer3"
import {produce as produce4, setAutoFreeze as setAutoFreeze4} from "immer4"
import {produce as produce5, setAutoFreeze as setAutoFreeze5} from "immer5"
import {produce as produce6, setAutoFreeze as setAutoFreeze6} from "immer6"
import {produce as produce7, setAutoFreeze as setAutoFreeze7} from "immer7"
import {produce as produce8, setAutoFreeze as setAutoFreeze8} from "immer8"
import {produce as produce9, setAutoFreeze as setAutoFreeze9} from "immer9"
import {produce as produce10, setAutoFreeze as setAutoFreeze10} from "immer10"
import {create as produceMutative} from "mutative";
import {produce as produceMutativeCompat, setAutoFreeze as setAutoFreezeMutativeCompat} from "mutative-compat";
import {bench, run, group, summary} from "mitata"



function createInitialState() {
  const initialState = {
    largeArray: Array.from({length: 10000}, (_, i) => ({
      id: i,
      value: Math.random(),
      nested: {key: `key-${i}`, data: Math.random()},
      moreNested: {
        items: Array.from({length: 100}, (_, i) => ({id: i, name: String(i)}))
      }
    })),
    otherData: Array.from({length: 10000}, (_, i) => ({
      id: i,
      name: `name-${i}`,
      isActive: i % 2 === 0
    }))
  }
  return initialState;
}

const MAX = 1

const add = index => ({
	type: "test/addItem",
	payload: {id: index, value: index, nested: {data: index}}
})
const remove = index => ({type: "test/removeItem", payload: index})
const update = index => ({
	type: "test/updateItem",
	payload: {id: index, value: index, nestedData: index}
})
const concat = index => ({
	type: "test/concatArray",
	payload: Array.from({length: 500}, (_, i) => ({id: i, value: index}))
})

const actions = {
  add,
  remove,
  update,
  concat
}

const immerProducers = {
  immer2: produce2,
  immer3: produce3,
  immer4: produce4,
  immer5: produce5,
  immer6: produce6,
  immer7: produce7,
  immer8: produce8,
  immer9: produce9,
  immer10: produce10,
  mutative: produceMutative,
  mutativeCompat: produceMutativeCompat
}

const setAutoFreezes = {
  vanilla: () => {},
  immer2: setAutoFreeze2,
  immer3: setAutoFreeze3,
  immer4: setAutoFreeze4,
  immer5: setAutoFreeze5,
  immer6: setAutoFreeze6,
  immer7: setAutoFreeze7,
  immer8: setAutoFreeze8,
  immer9: setAutoFreeze9,
  immer10: setAutoFreeze10,
  mutative: () => {},
  mutativeCompat: setAutoFreezeMutativeCompat
}

const vanillaReducer = (state = createInitialState(), action) => {
	switch (action.type) {
		case "test/addItem":
			return {
				...state,
				largeArray: [...state.largeArray, action.payload]
			}
		case "test/removeItem": {
      const newArray = state.largeArray.slice()
      newArray.splice(action.payload, 1)
			return {
				...state,
				largeArray: newArray
			}
    }
		case "test/updateItem": {
			return {
				...state,
				largeArray: state.largeArray.map(item =>
					item.id === action.payload.id
						? {
								...item,
								value: action.payload.value,
								nested: {...item.nested, data: action.payload.nestedData}
						  }
						: item
				)
			}
    }
		case "test/concatArray": {
      const length = state.largeArray.length
			const newArray = action.payload.concat(state.largeArray)
			newArray.length = length
			return {
				...state,
				largeArray: newArray
			}
    }
		default:
			return state
	}
}

const createImmerReducer = (produce) => {
  const immerReducer = (state = createInitialState(), action) =>
    produce(state, draft => {
      switch (action.type) {
        case "test/addItem":
          draft.largeArray.push(action.payload)
          break
        case "test/removeItem":
          draft.largeArray.splice(action.payload, 1)
          break
        case "test/updateItem": {
          const item = draft.largeArray.find(
            item => item.id === action.payload.id
          )
          item.value = action.payload.value
          item.nested.data = action.payload.nestedData
          break
        }
        case "test/concatArray": {
          const length = state.largeArray.length
          const newArray = action.payload.concat(state.largeArray)
          newArray.length = length
          draft.largeArray = newArray
          break
        }
      }
    })

    return immerReducer
}

function mapValues(obj, fn) {
  const result = {}
  for (const key in obj) {
    result[key] = fn(obj[key])
  }
  return result
}

const reducers = {
  vanilla: vanillaReducer,
  ...mapValues(immerProducers, createImmerReducer)
}

function createBenchmarks() {
  for (const action in actions) {
    summary(function() {  
      bench(`$action: $version (freeze: $freeze)`, function* (args) {
        const version = args.get("version")
        const freeze = args.get("freeze")
        const action = args.get("action")

        const initialState = createInitialState()
  
        function benchMethod() {
          setAutoFreezes[version](freeze)
          for (let i = 0; i < MAX; i++) {
            reducers[version](initialState, actions[action](5000))
          }
          setAutoFreezes[version](false)
        }
       
        yield benchMethod
  
  
      }).args({
        version: Object.keys(reducers),
        freeze: [false, true],
        action: [action]
      })
    })
    
  }
}

async function main() {
  createBenchmarks()
	await run()
}

main()
