PEER=$GOPATH/src/github.com/hyperledger/fabric/.build/bin/peer
MSP=/Users/user/Documents/Fabric-Dev/src/github.com/davidkel/fabric-sdk-node/fabric-network/e2e/fabric/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
MSPID=Org1MSP
# CORE_CHAINCODE_ID_NAME="demo:0.0.1" node test/simpleChaincode.js --peer.address grpc://localhost:7052 &
CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode instantiate -o localhost:7050 -C composerchannel -n demo -v 0.0.1 -c '{"Args":["Begin", "key1", "1"]}'
