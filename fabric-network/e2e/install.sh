# ./fabric/startFabric.sh -d
PEER=$GOPATH/src/github.com/hyperledger/fabric/.build/bin/peer
MSP=/Users/user/Documents/Fabric-Dev/src/github.com/davidkel/fabric-sdk-node/fabric-network/e2e/fabric/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
MSPID=Org1MSP
CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -n demo -p github.com/davidkel/fabric-sdk-node/fabric-network/e2e/dummy -v 0.0.1
# CORE_CHAINCODE_ID_NAME="demo:0.0.1" node test/simpleChaincode.js --peer.address grpc://localhost:7052
# CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode instantiate -o localhost:7050 -C composer -l node -n demo -v 0.0.1 -c '{"Args":["init", "key1", 1, "key2", 2]}'
