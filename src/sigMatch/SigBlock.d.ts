type Signature = SigBlock|BaseBlock;

interface BaseBlock {
    type: String,
    [prop: string]: any;
}

interface SigBlock {
    $sig: SigContent,
}

interface SigContent {
    // results variable
    name?: string,
    partialArray?: Signature[],
    $or?: Signature[],
}
