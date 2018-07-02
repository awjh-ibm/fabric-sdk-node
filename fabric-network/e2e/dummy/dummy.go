package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// SimpleAsset implements a simple chaincode to manage an asset
type SimpleAsset struct {
}

// Init is called during chaincode instantiation to initialize any
// data. Note that chaincode upgrade also calls this function to reset
// or to migrate data.
func (t *SimpleAsset) Begin(stub shim.ChaincodeStubInterface) peer.Response {
	// Get the args from the transaction proposal
	_, args := stub.GetFunctionAndParameters()
	if len(args) != 2 {
		return shim.Error("Incorrect arguments. Expecting a key and a value")
	}

	// Set up any variables or assets here by calling stub.PutState()

	// We store the key and the value on the ledger
	err := stub.PutState(args[0], []byte(args[1]))
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to create asset: %s", args[0]))
	}
	return shim.Success(nil)
}

// Set stores the asset (both key and value) on the ledger. If the key exists,
// it will override the value with the new one
func (t *SimpleAsset) Set(stub shim.ChaincodeStubInterface) peer.Response {
	_, args := stub.GetFunctionAndParameters()

	if len(args) != 2 {
		return shim.Error("Incorrect arguments. Expecting a key and a value")
	}

	err := stub.PutState(args[0], []byte(args[1]))
	if err != nil {
		errorMsg := fmt.Sprintf("Failed to set asset: %s ", args[0])
		return shim.Error(errorMsg)
	}
	return shim.Success([]byte(args[1]))
}

// Get returns the value of the specified asset key
func (t *SimpleAsset) Get(stub shim.ChaincodeStubInterface) peer.Response {
	_, args := stub.GetFunctionAndParameters()

	if len(args) != 1 {
		return shim.Error("Incorrect arguments. Expecting a key")
	}

	value, err := stub.GetState(args[0])
	if err != nil {
		errorMsg := fmt.Sprintf("Failed to get asset: %s with error: %s", args[0], err)
		return shim.Error(errorMsg)
	}
	if value == nil {
		errorMsg := fmt.Sprintf("Asset not found: %s", args[0])
		return shim.Error(errorMsg)
	}
	return shim.Success([]byte(value))
}

// main function starts up the chaincode in the container during instantiate
func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}
