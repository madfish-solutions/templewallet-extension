import { getMessage } from "lib/i18n";
import { ErrorType } from "lib/thanos/beacon";
import { isKTAddress } from "lib/thanos/front";

type RpcErrorEntry = {
  message: string | ((errorDetails: any) => string);
  beaconError?: ErrorType;
};

const rpcErrors: Record<string, RpcErrorEntry> = {
  "baking.insufficient_proof_of_work": {
    message: "The block's proof-of-work stamp is insufficient",
  },
  "baking.invalid_block_signature": {
    message: "A block was not signed with the expected private key.",
  },
  "baking.invalid_endorsement_slot": {
    message: "The endorsement slot provided is negative or too high.",
  },
  "baking.invalid_fitness_gap": {
    message: "The gap of fitness is out of bounds",
  },
  "baking.invalid_signature": {
    message: "The block's signature is invalid",
  },
  "baking.timestamp_too_early": {
    message:
      "The block timestamp is before the first slot for this baker at this level",
  },
  "baking.unexpected_endorsement": {
    message:
      "The operation is signed by a delegate without endorsement rights.",
  },
  "baking.unexpected_endorsement_slot": {
    message: "The endorsement slot provided is not the smallest possible.",
  },
  "block.inconsistent_double_baking_evidence": {
    message:
      "A double-baking evidence is inconsistent  (two distinct delegates)",
  },
  "block.inconsistent_double_endorsement_evidence": {
    message:
      "A double-endorsement evidence is inconsistent  (two distinct delegates)",
  },
  "block.invalid_commitment": {
    message: "The block header has invalid commitment.",
  },
  "block.invalid_double_baking_evidence": {
    message: "A double-baking evidence is inconsistent  (two distinct level)",
  },
  "block.invalid_double_endorsement_evidence": {
    message: "A double-endorsement evidence is malformed",
  },
  "block.multiple_revelation": {
    message: "A manager operation should not contain more than one revelation",
  },
  "block.outdated_double_baking_evidence": {
    message: "A double-baking evidence is outdated.",
  },
  "block.outdated_double_endorsement_evidence": {
    message: "A double-endorsement evidence is outdated.",
  },
  "block.too_early_double_baking_evidence": {
    message: "A double-baking evidence is in the future",
  },
  "block.too_early_double_endorsement_evidence": {
    message: "A double-endorsement evidence is in the future",
  },
  "block.unrequired_double_baking_evidence": {
    message: "A double-baking evidence is unrequired",
  },
  "block.unrequired_double_endorsement_evidence": {
    message: "A double-endorsement evidence is unrequired",
  },
  "context.failed_to_decode_parameter": {
    message: (errorDetails: any) => {
      const { contents } = errorDetails;
      return contents !== undefined
        ? `Unexpected JSON object: ${contents}`
        : "Unexpected JSON object";
    },
  },
  "context.failed_to_parse_parameter": {
    message: "The protocol parameters are not valid JSON.",
    beaconError: ErrorType.PARAMETERS_INVALID_ERROR,
  },
  "context.storage_error": {
    message: "Something has been deleted or corrupted in the database.",
  },
  "contract.balance_too_low": {
    message: (errorDetails: any) =>
      getMessage(
        "operationTriedToSpendMoreTokens",
        getMessage(
          isKTAddress(errorDetails.contract) ? "contract" : "account"
        ).toLowerCase()
      ),
  },
  "contract.cannot_pay_storage_fee": {
    message: "The storage fee is higher than the contract or account balance",
  },
  "contract.counter_in_the_future": {
    message: "An operation assumed a contract counter in the future",
  },
  "contract.counter_in_the_past": {
    message: "An operation assumed a contract counter in the past",
  },
  "contract.empty_transaction": {
    message: "Forbidden to credit 0ꜩ to a contract without code.",
    beaconError: ErrorType.PARAMETERS_INVALID_ERROR,
  },
  "contract.failure": {
    message: "Unexpected contract storage error",
  },
  "contract.invalid_contract_notation": {
    message:
      "A malformed contract notation was given to an RPC or in a script.",
  },
  "contract.manager.consume_roll_change": {
    message: "Change is not enough to consume a roll.",
  },
  "contract.manager.inconsistent_hash": {
    message:
      "A revealed manager public key is inconsistent with the announced hash",
  },
  "contract.manager.inconsistent_public_key": {
    message:
      "A provided manager public key is different with the public key stored in the contract",
  },
  "contract.manager.no_roll_for_delegate": {
    message: "Delegate has no roll.",
  },
  "contract.manager.no_roll_snapshot_for_cycle": {
    message:
      "A snapshot of the rolls distribution does not exist for this cycle.",
  },
  "contract.manager.unregistered_delegate": {
    message: (errorDetails: any) => getMessage("delegateNotRegistered", errorDetails.hash),
  },
  "contract.non_existing_contract": {
    message:
      "A contract handle is not present in the context (either it never was or it has been destroyed)",
  },
  "contract.previously_revealed_key": {
    message: "One tried to reveal twice a manager public key",
  },
  "contract.unrevealed_key": {
    message:
      "One tried to apply a manager operation without revealing the manager public key",
  },
  "contract.unspendable_contract": {
    message: "An operation tried to spend tokens from an unspendable contract",
  },
  "delegate.already_active": {
    message: "Useless delegate reactivation",
  },
  "delegate.balance_too_low_for_deposit": {
    message: "Cannot freeze deposit when the balance is too low",
  },
  "delegate.empty_delegate_account": {
    message: "Cannot register a delegate when its implicit account is empty",
  },
  "delegate.no_deletion": {
    message: "Tried to unregister a delegate",
  },
  "delegate.unchanged": {
    message: getMessage("contractAlreadyDelegated"),
    beaconError: ErrorType.PARAMETERS_INVALID_ERROR,
  },
  empty_proposal: {
    message: getMessage("proposalListsCannotBeEmpty"),
    beaconError: ErrorType.PARAMETERS_INVALID_ERROR,
  },
  "gas_exhausted.block": {
    message:
      "The sum of gas consumed by all the operations in the block exceeds the hard gas limit per block",
  },
  "gas_exhausted.init_deserialize": {
    message: getMessage("gasLimitNotEnoughToDeserialize"),
    beaconError: ErrorType.PARAMETERS_INVALID_ERROR,
  },
  "gas_exhausted.operation": {
    message:
      "A script or one of its callee took more time than the operation said it would",
  },
  gas_limit_too_high: {
    message: "A transaction tried to exceed the hard limit on gas",
  },
  "implicit.empty_implicit_contract": {
    message: (errorDetails: any) =>
      getMessage(
        isKTAddress(errorDetails.implicit)
          ? "emptyImplicitContractError"
          : "unrevealedAccountError"
      ),
  },
  "implicit.empty_implicit_delegated_contract": {
    message: "Emptying an implicit delegated account is not allowed.",
  },
  incorrect_number_of_endorsements: {
    message:
      "The number of endorsements must be non-negative and at most the endorsers_per_block constant.",
  },
  incorrect_priority: {
    message: "Block priority must be non-negative.",
  },
  internal_operation_replay: {
    message: "An internal operation was emitted twice by a script",
  },
  invalid_arg: {
    message: "Negative multiple of periods are not allowed.",
  },
  invalid_binary_format: {
    message:
      "Could not deserialize some piece of data from its binary representation",
  },
  invalid_fitness: {
    message: "Fitness representation should be exactly 8 bytes long.",
  },
  invalid_proposal: {
    message: "Ballot provided for a proposal that is not the current one.",
  },
  malformed_period: {
    message: "Period is negative.",
  },
  "michelson_v1.bad_contract_parameter": {
    message: getMessage("badContractParameter"),
    beaconError: ErrorType.PARAMETERS_INVALID_ERROR,
  },
  "michelson_v1.bad_dupn_argument": {
    message: "DUP expects an argument of at least 1 (passed 0)",
  },
  "michelson_v1.bad_dupn_stack": {
    message: "Stack present when typing DUP n was too short",
  },
  "michelson_v1.bad_pair_argument": {
    message: "PAIR expects an argument of at least 2",
  },
  "michelson_v1.bad_return": {
    message: "Unexpected stack at the end of a lambda or script.",
  },
  "michelson_v1.bad_stack": {
    message: "The stack has an unexpected length or contents.",
  },
  "michelson_v1.bad_stack_item": {
    message:
      "The type of a stack item is unexpected (this error is always accompanied by a more precise one).",
  },
  "michelson_v1.bad_unpair_argument": {
    message: "UNPAIR expects an argument of at least 2",
  },
  "michelson_v1.cannot_serialize_error": {
    message: "The error was too big to be serialized with the provided gas",
  },
  "michelson_v1.cannot_serialize_failure": {
    message:
      "Argument of FAILWITH was too big to be serialized with the provided gas",
  },
  "michelson_v1.cannot_serialize_log": {
    message:
      "Execution trace with stacks was to big to be serialized with the provided gas",
  },
  "michelson_v1.cannot_serialize_storage": {
    message:
      "The returned storage was too big to be serialized with the provided gas",
  },
  "michelson_v1.comparable_type_expected": {
    message:
      "A non comparable type was used in a place where only comparable types are accepted.",
  },
  "michelson_v1.deprecated_instruction": {
    message:
      "A deprecated instruction usage is disallowed in newly created contracts",
  },
  "michelson_v1.duplicate_entrypoint": {
    message: "Two entrypoints have the same name.",
  },
  "michelson_v1.duplicate_map_keys": {
    message: "Map literals cannot contain duplicated keys",
  },
  "michelson_v1.duplicate_script_field": {
    message: "When parsing script, a field was found more than once",
  },
  "michelson_v1.duplicate_set_values_in_literal": {
    message:
      "Set literals cannot contain duplicate elements, but a duplicate was found while parsing.",
  },
  "michelson_v1.entrypoint_name_too_long": {
    message: "An entrypoint name exceeds the maximum length of 31 characters.",
  },
  "michelson_v1.fail_not_in_tail_position": {
    message: "There is non trivial garbage code after a FAIL instruction.",
  },
  "michelson_v1.ill_formed_type": {
    message:
      "The toplevel error thrown when trying to parse a type expression (always followed by more precise errors).",
  },
  "michelson_v1.ill_typed_contract": {
    message:
      "The toplevel error thrown when trying to typecheck a contract code against given input, output and storage types (always followed by more precise errors).",
  },
  "michelson_v1.ill_typed_data": {
    message:
      "The toplevel error thrown when trying to typecheck a data expression against a given type (always followed by more precise errors).",
  },
  "michelson_v1.inconsistent_annotations": {
    message: "The annotations on two types could not be merged",
  },
  "michelson_v1.inconsistent_field_annotations": {
    message:
      "The specified field does not match the field annotation in the type",
  },
  "michelson_v1.inconsistent_memo_sizes": {
    message: "Memo sizes of two sapling states or transactions do not match",
  },
  "michelson_v1.inconsistent_stack_lengths": {
    message:
      "A stack was of an unexpected length (this error is always in the context of a located error).",
  },
  "michelson_v1.inconsistent_type_annotations": {
    message: "The two types contain annotations that do not match",
  },
  "michelson_v1.inconsistent_types": {
    message: getMessage("typeClashErrorOccurred"),
  },
  "michelson_v1.interp_too_many_recursive_calls": {
    message:
      "Too many recursive calls were needed for interpretation of a Michelson script",
  },
  "michelson_v1.invalid_arity": {
    message:
      "In a script or data expression, a primitive was applied to an unsupported number of arguments.",
  },
  "michelson_v1.invalid_big_map": {
    message:
      "A script or data expression references a big_map that does not exist or assumes a wrong type for an existing big_map.",
  },
  "michelson_v1.invalid_constant": {
    message: "A data expression was invalid for its expected type.",
  },
  "michelson_v1.invalid_contract": {
    message:
      "A script or data expression references a contract that does not exist or assumes a wrong type for an existing contract.",
  },
  "michelson_v1.invalid_expression_kind": {
    message:
      "In a script or data expression, an expression was of the wrong kind (for instance a string where only a primitive applications can appear).",
  },
  "michelson_v1.invalid_iter_body": {
    message:
      "The body of an ITER instruction must result in the same stack type as before the ITER.",
  },
  "michelson_v1.invalid_map_block_fail": {
    message:
      "FAIL cannot be the only instruction in the body. The proper type of the return list cannot be inferred.",
  },
  "michelson_v1.invalid_map_body": {
    message: "The body of a map block did not match the expected type",
  },
  "michelson_v1.invalid_never_expr": {
    message:
      "In a script or data expression, an expression was provided but a value of type never was expected. No expression can have type never.",
  },
  "michelson_v1.invalid_primitive": {
    message: "In a script or data expression, a primitive was unknown.",
  },
  "michelson_v1.invalid_primitive_name": {
    message:
      "In a script or data expression, a primitive name is unknown or has a wrong case.",
  },
  "michelson_v1.invalid_primitive_name_case": {
    message:
      "In a script or data expression, a primitive name is neither uppercase, lowercase or capitalized.",
  },
  "michelson_v1.invalid_primitive_namespace": {
    message:
      "In a script or data expression, a primitive was of the wrong namespace.",
  },
  "michelson_v1.invalid_seq_arity": {
    message:
      "In a script or data expression, a sequence was used with a number of elements too small.",
  },
  "michelson_v1.invalid_syntactic_constant": {
    message: "A compile-time constant was invalid for its expected form.",
  },
  "michelson_v1.missing_script_field": {
    message: "When parsing script, a field was expected, but not provided",
  },
  "michelson_v1.no_such_entrypoint": {
    message: "An entrypoint was not found when calling a contract.",
  },
  "michelson_v1.non_dupable_type": {
    message: "DUP was used on a non-dupable type (e.g. tickets).",
  },
  "michelson_v1.runtime_error": {
    message: "Toplevel error for all runtime script errors",
  },
  "michelson_v1.script_overflow": {
    message:
      "A FAIL instruction was reached due to the detection of an overflow",
  },
  "michelson_v1.script_rejected": {
    message: "A FAILWITH instruction was reached",
  },
  "michelson_v1.self_in_lambda": {
    message: "A SELF instruction was encountered in a lambda expression.",
  },
  "michelson_v1.type_too_large": {
    message: "An instruction generated a type larger than the limit.",
  },
  "michelson_v1.typechecking_too_many_recursive_calls": {
    message: "Too many recursive calls were needed for typechecking",
  },
  "michelson_v1.undefined_binop": {
    message:
      "A binary operation is called on operands of types over which it is not defined.",
  },
  "michelson_v1.undefined_unop": {
    message:
      "A unary operation is called on an operand of type over which it is not defined.",
  },
  "michelson_v1.unexpected_annotation": {
    message: "A node in the syntax tree was improperly annotated",
  },
  "michelson_v1.unexpected_contract": {
    message:
      "When parsing script, a contract type was found in the storage or parameter field.",
  },
  "michelson_v1.unexpected_forged_value": {
    message: "A forged value was encountered but disallowed for that position.",
  },
  "michelson_v1.unexpected_lazy_storage": {
    message:
      "When parsing script, a big_map or sapling_state type was found in a position where it could end up stored inside a big_map, which is forbidden for now.",
  },
  "michelson_v1.unexpected_operation": {
    message:
      "When parsing script, an operation type was found in the storage or parameter field.",
  },
  "michelson_v1.unexpected_ticket": {
    message: "A ticket type has been found",
  },
  "michelson_v1.ungrouped_annotations": {
    message: "Annotations of the same kind must be grouped",
  },
  "michelson_v1.unknown_primitive_name": {
    message: "In a script or data expression, a primitive was unknown.",
  },
  "michelson_v1.unmatched_branches": {
    message:
      "At the join point at the end of two code branches the stacks have inconsistent lengths or contents.",
  },
  "michelson_v1.unordered_map_literal": {
    message: "Map keys must be in strictly increasing order",
  },
  "michelson_v1.unordered_set_literal": {
    message: "Set values must be in strictly increasing order",
  },
  "michelson_v1.unparsing_stack_overflow": {
    message: "Too many recursive calls were needed for unparsing",
  },
  "michelson_v1.unreachable_entrypoint": {
    message: "An entrypoint in the contract is not reachable.",
  },
  "nonce.previously_revealed": {
    message: "Duplicated revelation for a nonce.",
  },
  "nonce.too_early_revelation": {
    message: "Nonce revelation happens before cycle end",
  },
  "nonce.too_late_revelation": {
    message: "Nonce revelation happens too late",
  },
  "nonce.unexpected": {
    message:
      "The provided nonce is inconsistent with the committed nonce hash.",
  },
  "operation.cannot_parse": {
    message: "The operation is ill-formed or for another protocol version",
  },
  "operation.duplicate_endorsement": {
    message: "Two endorsements received from same delegate",
  },
  "operation.failing_noop": {
    message:
      "The failing_noop operation is an operation that is not and never will be executed by the protocol.",
  },
  "operation.inconsistent_sources": {
    message: "The operation pack includes operations from different sources.",
  },
  "operation.invalid_activation": {
    message:
      "The given key and secret do not correspond to any existing preallocated contract",
  },
  "operation.invalid_endorsement_level": {
    message:
      "The level of an endorsement is inconsistent with the  provided block hash.",
  },
  "operation.invalid_endorsement_wrapper": {
    message:
      "The wrapper of an endorsement is inconsistent with the endorsement it wraps.",
  },
  "operation.invalid_signature": {
    message:
      "The operation signature is ill-formed or has been made with the wrong public key",
  },
  "operation.missing_signature": {
    message:
      "The operation is of a kind that must be signed, but the signature is missing",
  },
  "operation.not_enough_endorsements_for_priority": {
    message:
      "The block being validated does not include the required minimum number of endorsements for this priority.",
  },
  "operation.unwrapped_endorsement": {
    message:
      "A legacy endorsement has been applied without its required slot-bearing wrapper.",
  },
  "operation.wrong_endorsement_predecessor": {
    message:
      "Trying to include an endorsement in a block that is not the successor of the endorsed one",
  },
  "operation.wrong_voting_period": {
    message:
      "Trying to include a proposal or ballot meant for another voting period",
  },
  "seed.unknown_seed": {
    message: "The requested seed is not available",
  },
  "storage_exhausted.operation": {
    message:
      "A script or one of its callee wrote more bytes than the operation said it would",
  },
  storage_limit_too_high: {
    message: "A transaction tried to exceed the hard limit on storage",
  },
  "tez.addition_overflow": {
    message: "An addition of two tez amounts overflowed",
  },
  "tez.invalid_divisor": {
    message: "Multiplication of a tez amount by a non positive integer",
  },
  "tez.multiplication_overflow": {
    message: "A multiplication of a tez amount by an integer overflowed",
  },
  "tez.negative_multiplicator": {
    message: "Multiplication of a tez amount by a negative integer",
  },
  "tez.subtraction_underflow": {
    message: "An subtraction of two tez amounts underflowed",
  },
  timestamp_add: {
    message: "Overflow when adding timestamps.",
  },
  timestamp_sub: {
    message: "Subtracting timestamps resulted in negative period.",
  },
  too_many_internal_operations: {
    message:
      "A transaction exceeded the hard limit of internal operations it can emit",
  },
  too_many_proposals: {
    message: "The delegate reached the maximum number of allowed proposals.",
  },
  unauthorized_ballot: {
    message:
      "The delegate provided for the ballot is not in the voting listings.",
  },
  unauthorized_proposal: {
    message:
      "The delegate provided for the proposal is not in the voting listings.",
  },
  undefined_operation_nonce: {
    message:
      "An origination was attempted out of the scope of a manager operation",
  },
  unexpected_ballot: {
    message: "Ballot recorded outside of a voting period.",
  },
  unexpected_level: {
    message: "Level must be non-negative.",
  },
  unexpected_nonce_length: {
    message: "Nonce length is incorrect.",
  },
  unexpected_proposal: {
    message: "Proposal recorded outside of a proposal period.",
  },
  "node.bootstrap_pipeline.invalid_locator": {
    message: "Block locator is invalid.",
  },
  "node.bootstrap_pipeline.too_short_locator": {
    message: "Block locator is too short.",
  },
  "node.p2p_connect_handler.identity_check_failure": {
    message:
      "Peer announced an identity which does not match the one specified on the command-line.",
  },
  "node.p2p_io_scheduler.connection_closed": {
    message: "IO error: connection with a peer is closed.",
  },
  "node.p2p_pool.connected": {
    message:
      "Fail to connect with a peer: a connection is already established.",
  },
  "node.p2p_pool.connection_refused": {
    message: "Connection was refused.",
  },
  "node.p2p_pool.disabled": {
    message: "The P2P layer on this node is not active.",
  },
  "node.p2p_pool.peer_banned": {
    message: "The peer identity you tried to connect is banned.",
  },
  "node.p2p_pool.pending_connection": {
    message: "Fail to connect with a peer: a connection is already pending.",
  },
  "node.p2p_pool.point_banned": {
    message: "The address you tried to connect is banned.",
  },
  "node.p2p_pool.private_mode": {
    message: "Node is in private mode.",
  },
  "node.p2p_pool.rejected": {
    message: "Connection to peer was rejected by us.",
  },
  "node.p2p_pool.too_many_connections": {
    message: "Too many connections.",
  },
  "node.p2p_socket.decipher_error": {
    message: "An error occurred while deciphering.",
  },
  "node.p2p_socket.decoding_error": {
    message: "An error occurred while decoding.",
  },
  "node.p2p_socket.invalid_auth": {
    message: "Rejected peer connection: invalid authentication.",
  },
  "node.p2p_socket.invalid_chunks_size": {
    message: "Size of chunks is not valid.",
  },
  "node.p2p_socket.invalid_incoming_ciphertext_size": {
    message: "The announced size for the incoming ciphertext is invalid.",
  },
  "node.p2p_socket.invalid_message_size": {
    message: "The size of the message to be written is invalid.",
  },
  "node.p2p_socket.myself": {
    message: "Remote peer is actually yourself.",
  },
  "node.p2p_socket.not_enough_proof_of_work": {
    message: "Remote peer cannot be authenticated: not enough proof of work.",
  },
  "node.p2p_socket.rejected_by_nack": {
    message:
      "Rejected peer connection: The peer rejected the socket connection by Nack with a list of alternative peers.",
  },
  "node.p2p_socket.rejected_no_common_protocol": {
    message:
      "Rejected peer connection: rejected socket connection as we have no common network protocol with the peer.",
  },
  "node.p2p_socket.rejected_socket_connection": {
    message: "Rejected peer connection: rejected socket connection.",
  },
  "node.p2p_socket.rejecting_incoming": {
    message: "Rejecting peer connection with motive.",
  },
  "node.peer_validator.known_invalid": {
    message: "Known invalid block found in the peer's chain",
  },
  "node.peer_validator.unknown_ancestor": {
    message: "Unknown ancestor block found in the peer's chain",
  },
  "node.prevalidation.future_block_header": {
    message: "The block was annotated with a time too far in the future.",
  },
  "node.prevalidation.oversized_operation": {
    message: "The operation size is bigger than allowed.",
  },
  "node.prevalidation.parse_error": {
    message:
      "Raised when an operation has not been parsed correctly during prevalidation.",
  },
  "node.prevalidation.too_many_operations": {
    message: "The prevalidation context is full.",
  },
  "node.protocol_validator.cannot_load_protocol": {
    message: "Cannot load protocol from disk",
  },
  "node.protocol_validator.invalid_protocol": {
    message: "Invalid protocol.",
  },
  "node.state.bad_data_dir": {
    message: `The data directory could not be read. This could be because it was generated with an old \
version of the tezos-node program. Deleting and regenerating this directory may fix the problem.`,
  },
  "node.state.block.inconsistent_context_hash": {
    message:
      "When committing the context of a block, the announced context hash was not the one computed at commit time.",
  },
  "node.state.block.missing_block_metadata_hash": {
    message:
      "A block was expected to commit to a block metadata hash, however none was given.",
  },
  "node.state.block.missing_operation_metadata_hashes": {
    message:
      "A block was expected to commit to operation metadata hashes, however none were given.",
  },
  "node.state.block_not_invalid": {
    message: "The invalid block to be unmarked was not actually invalid.",
  },
  "node.state.unknown_chain": {
    message:
      "The chain identifier could not be found in the chain identifiers table.",
  },
  "node.validator.checkpoint_error": {
    message:
      "The block belongs to a branch that is not compatible with the current checkpoint.",
  },
  "node.validator.inactive_chain": {
    message: "Attempted validation of a block from an inactive chain.",
  },
  "node_config_file.incorrect_history_mode_switch": {
    message: "Incorrect history mode switch.",
  },
  "raw_store.unknown": {
    message: "Missing key in store",
  },
  "validator.inconsistent_operations_hash": {
    message:
      "The provided list of operations is inconsistent with the block header.",
  },
  "validator.invalid_block": {
    message: "Invalid block.",
  },
  "validator.missing_test_protocol": {
    message: "Missing test protocol when forking the test chain",
  },
  "validator.unavailable_protocol": {
    message: "The protocol required for validating a block is missing.",
  },
  "validator.validation_process_failed": {
    message: "Failed to validate block using external validation process.",
  },
  "worker.closed": {
    message:
      "An operation on a worker could not complete before it was shut down.",
  },
  "micheline.parse_error.annotation_exceeds_max_length": {
    message:
      "While parsing a piece of Micheline source, an annotation exceeded the maximum length (255).",
  },
  "micheline.parse_error.empty_expression": {
    message:
      "Tried to interpret an empty piece or Micheline source as a single expression.",
  },
  "micheline.parse_error.extra_token": {
    message:
      "While parsing a piece of Micheline source, an extra semi colon or parenthesis was encountered.",
  },
  "micheline.parse_error.invalid_utf8_sequence": {
    message:
      "While parsing a piece of Micheline source, a sequence of bytes that is not valid UTF-8 was encountered.",
  },
  "micheline.parse_error.misaligned_node": {
    message:
      "While parsing a piece of Micheline source, an expression was not aligned with its siblings of the same mother application or sequence.",
  },
  "micheline.parse_error.missing_break_after_number": {
    message:
      "While parsing a piece of Micheline source, a number was not visually separated from its follower token, leading to misreadability.",
  },
  "micheline.parse_error.odd_lengthed_bytes": {
    message:
      "While parsing a piece of Micheline source, the length of a byte sequence (0x...) was not a multiple of two, leaving a trailing half byte.",
  },
  "micheline.parse_error.unclosed_token": {
    message:
      "While parsing a piece of Micheline source, a parenthesis or a brace was unclosed.",
  },
  "micheline.parse_error.undefined_escape_sequence": {
    message:
      "While parsing a piece of Micheline source, an unexpected escape sequence was encountered in a string.",
  },
  "micheline.parse_error.unexpected_character": {
    message:
      "While parsing a piece of Micheline source, an unexpected character was encountered.",
  },
  "micheline.parse_error.unexpected_token": {
    message:
      "While parsing a piece of Micheline source, an unexpected token was encountered.",
  },
  "micheline.parse_error.unterminated_comment": {
    message:
      "While parsing a piece of Micheline source, a commentX was not terminated.",
  },
  "micheline.parse_error.unterminated_integer": {
    message:
      "While parsing a piece of Micheline source, an integer was not terminated.",
  },
  "micheline.parse_error.unterminated_string": {
    message:
      "While parsing a piece of Micheline source, a string was not terminated.",
  },
  "rpc_client.request_failed": {
    message: "Request failed for an unknown reason",
  },
  Bad_hash: {
    message: "Wrong hash given",
  },
  "Block_validator_process.failed_to_checkout_context": {
    message: "The context checkout failed using a given hash",
  },
  "Block_validator_process.failed_to_get_live_block": {
    message: "Unable to get live blocks from a given hash",
  },
  CannotReconstruct: {
    message: "Cannot reconstruct",
  },
  Context_not_found: {
    message: "Cannot find context corresponding to hash",
  },
  InconsistentImportedBlock: {
    message: "The imported block is not the expected one.",
  },
  InconsistentOperationHashes: {
    message: "The operations given do not match their hashes.",
  },
  InconsistentOperationHashesLengths: {
    message: "Different number of operations and hashes given.",
  },
  Inconsistent_snapshot_data: {
    message: "The data provided by the snapshot is inconsistent",
  },
  Inconsistent_snapshot_file: {
    message: "Error while opening snapshot file",
  },
  InvalidBlockSpecification: {
    message: "Invalid specification of block to import",
  },
  Invalid_snapshot_version: {
    message: "The version of the snapshot to import is not valid",
  },
  Missing_snapshot_data: {
    message: "Mandatory data missing while reaching end of snapshot file.",
  },
  "RPC.Empty_error_list": {
    message: "The RPC returned with an error code but no associated error.",
  },
  "RPC.Unexpected_error_encoding": {
    message: `The RPC returned with an error code, and the associated body was not a valid error \
trace. It is likely that the answer does not comes directly from a compatible node.`,
  },
  "RPC_context.Gone": {
    message:
      "RPC lookup failed. Block has been pruned and requested data deleted.",
  },
  "RPC_context.Not_found": {
    message:
      "RPC lookup failed. No RPC exists at the URL or the RPC tried to access non-existent data.",
  },
  Restore_context_failure: {
    message: "Internal error while restoring the context",
  },
  SnapshotImportFailure: {
    message: "The imported snapshot is malformed.",
  },
  System_read_error: {
    message: "Failed to read file",
  },
  "Validator_process.system_error_while_validating": {
    message: "The validator failed because of a system error",
  },
  Writing_error: {
    message: "Cannot write in file for context dump",
  },
  WrongBlockExport: {
    message: "The block to export in the snapshot is not valid.",
  },
  WrongProtocolHash: {
    message: "Wrong protocol hash",
  },
  WrongSnapshotExport: {
    message:
      "Snapshot exports is not compatible with the current configuration.",
  },
  "block_validation.cannot_serialize_metadata": {
    message: "Unable to serialize metadata",
  },
  canceled: {
    message: "A promise was unexpectedly canceled",
  },
  "cli.key.invalid_uri": {
    message: "A key has been provided with an invalid uri.",
  },
  "cli.signature_mismatch": {
    message: "The signer produced an invalid signature",
  },
  "cli.unregistered_key_scheme": {
    message:
      "A key has been provided with an unregistered scheme (no corresponding plugin)",
  },
  "client.alpha.Bad deserialized counter": {
    message:
      "The byte sequence references a multisig counter that does not match the one currently stored in the given multisig contract",
  },
  "client.alpha.actionDeserialisation": {
    message:
      "When trying to deserialise an action from a sequence of bytes, we got an expression that does not correspond to a known multisig action",
  },
  "client.alpha.badDeserializedContract": {
    message:
      "When trying to deserialise an action from a sequence of bytes, we got an action for another multisig contract",
  },
  "client.alpha.badEndorsementDelayArg": {
    message: "invalid duration in -endorsement-delay",
  },
  "client.alpha.badMaxPriorityArg": {
    message: "invalid priority in -max-priority",
  },
  "client.alpha.badMaxWaitingTimeArg": {
    message: "invalid duration in -max-waiting-time",
  },
  "client.alpha.badMinimalFeesArg": {
    message: "invalid fee threshold in -fee-threshold",
  },
  "client.alpha.badPreservedLevelsArg": {
    message: "invalid number of levels in -preserved-levels",
  },
  "client.alpha.badTezArg": {
    message: "Invalid ꜩ notation in parameter.",
  },
  "client.alpha.bytesDeserialisation": {
    message:
      "When trying to deserialise an action from a sequence of bytes, we got an error",
  },
  "client.alpha.contractHasNoScript": {
    message:
      "A multisig command has referenced a scriptless smart contract instead of a multisig smart contract.",
  },
  "client.alpha.contractHasNoStorage": {
    message:
      "A multisig command has referenced a smart contract without storage instead of a multisig smart contract.",
  },
  "client.alpha.contractHasUnexpectedStorage": {
    message:
      "A multisig command has referenced a smart contract whose storage is of a different shape than the expected one.",
  },
  "client.alpha.contractWithoutCode": {
    message:
      "Attempt to get the code of a contract failed because it has nocode. No scriptless contract should remain.",
  },
  "client.alpha.invalidSignature": {
    message:
      "A signature was given for a multisig contract that matched none of the public keys of the contract signers",
  },
  "client.alpha.michelson.macros.bas_arity": {
    message: "A wrong number of arguments was provided to a macro",
  },
  "client.alpha.michelson.macros.sequence_expected": {
    message: "An macro expects a sequence, but a sequence was not provided",
  },
  "client.alpha.michelson.macros.unexpected_annotation": {
    message:
      "A macro had an annotation, but no annotation was permitted on this macro.",
  },
  "client.alpha.nonPositiveThreshold": {
    message: "A multisig threshold should be a positive number",
  },
  "client.alpha.notASupportedMultisigContract": {
    message:
      "A multisig command has referenced a smart contract whose script is not one of the known multisig contract scripts.",
  },
  "client.alpha.notEnoughSignatures": {
    message:
      "To run an action on a multisig contract, you should provide at least as many signatures as indicated by the threshold stored in the multisig contract.",
  },
  "client.alpha.thresholdTooHigh": {
    message:
      "The given threshold is higher than the number of keys, this would lead to a frozen multisig contract",
  },
  "context.non_recoverable_context": {
    message: "Cannot recover from a corrupted context.",
  },
  "context_dump.read.cannot_open": {
    message: "Cannot open file for context restoring",
  },
  "context_dump.read.suspicious": {
    message: "Suspicious file: data after end",
  },
  "context_dump.write.cannot_open": {
    message: "Cannot open file for context dump",
  },
  decoding_error: {
    message: "Error while decoding a value",
  },
  encoding_error: {
    message: "Error while encoding a value for a socket",
  },
  failure: {
    message: "Exception safely wrapped in an error",
  },
  "internal-event-activation-error": {
    message: "Activation of an Internal Event SINK with an URI failed",
  },
  "local_rpc_client.not_implemented_in_local_mode": {
    message: "A specific RPC is not implemented in mockup mode",
  },
  "local_rpc_client.request_failed": {
    message: "An RPC request failed in mockup mode",
  },
  "raw_context.invalid_depth": {
    message: "The raw context extraction depth argument must be positive.",
  },
  "registered_protocol.unregistered_protocol": {
    message: "No protocol was registered with the requested hash.",
  },
  "requester.Operation_hash.fetch_canceled": {
    message: "The fetch of a Operation_hash has been canceled",
  },
  "requester.Operation_hash.fetch_timeout": {
    message: "The fetch of a Operation_hash has timed out",
  },
  "requester.Operation_hash.missing": {
    message: "Some Operation_hash is missing from the requester",
  },
  "requester.Protocol_hash.fetch_canceled": {
    message: "The fetch of a Protocol_hash has been canceled",
  },
  "requester.Protocol_hash.fetch_timeout": {
    message: "The fetch of a Protocol_hash has timed out",
  },
  "requester.Protocol_hash.missing": {
    message: "Some Protocol_hash is missing from the requester",
  },
  "requester.block_hash.fetch_canceled": {
    message: "The fetch of a block_hash has been canceled",
  },
  "requester.block_hash.fetch_timeout": {
    message: "The fetch of a block_hash has timed out",
  },
  "requester.block_hash.missing": {
    message: "Some block_hash is missing from the requester",
  },
  "requester.operations.fetch_canceled": {
    message: "The fetch of a operations has been canceled",
  },
  "requester.operations.fetch_timeout": {
    message: "The fetch of a operations has timed out",
  },
  "requester.operations.missing": {
    message: "Some operations is missing from the requester",
  },
  "socket.unexepcted_size_of_decoded_value": {
    message: "A decoded value comes from a buffer of unexpected size.",
  },
  "state.block.contents_not_found": {
    message: "Block not found",
  },
  "state.block.not_found": {
    message: "Block not found",
  },
  unexepcted_size_of_encoded_value: {
    message: "An encoded value is not of the expected size.",
  },
  "unix.system_info": {
    message: "Unix System_info failure",
  },
  unix_error: {
    message: "An unhandled unix exception",
  },
  "utils.Canceled": {
    message: "Canceled",
  },
  "utils.Timeout": {
    message: "Timeout",
  },
};

export default rpcErrors;
