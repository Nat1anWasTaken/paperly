import { MainLayout } from "@/components/layouts/main-layout"

export default function Home() {
  const samplePaperSections = [
    { id: "abstract", title: "Abstract", level: 1 },
    { id: "introduction", title: "Introduction", level: 1 },
    { id: "related-work", title: "Related Work", level: 1 },
    { id: "methodology", title: "Methodology", level: 1 },
    { id: "model-architecture", title: "Model Architecture", level: 2 },
    { id: "training-procedure", title: "Training Procedure", level: 2 },
    { id: "experiments", title: "Experiments", level: 1 },
    { id: "datasets", title: "Datasets", level: 2 },
    { id: "evaluation-metrics", title: "Evaluation Metrics", level: 2 },
    { id: "results", title: "Results", level: 2 },
    { id: "discussion", title: "Discussion", level: 1 },
    { id: "limitations", title: "Limitations", level: 2 },
    { id: "future-work", title: "Future Work", level: 2 },
    { id: "conclusion", title: "Conclusion", level: 1 },
    { id: "references", title: "References", level: 1 },
  ]

  return (
    <MainLayout 
      paperTitle="Attention Is All You Need: A Comprehensive Study"
      paperSections={samplePaperSections}
    >
      <article className="space-y-8">
        <section id="abstract">
          <h1 className="text-4xl font-bold mb-4">Attention Is All You Need: A Comprehensive Study</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Authors: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Abstract</h2>
          <p>
            The dominant sequence transduction models are based on complex recurrent or convolutional neural networks 
            that include an encoder and a decoder. The best performing models also connect the encoder and decoder 
            through an attention mechanism. We propose a new simple network architecture, the Transformer, based 
            solely on attention mechanisms, dispensing with recurrence and convolutions entirely.
          </p>
        </section>

        <section id="introduction">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, 
            have been firmly established as state of the art approaches in sequence modeling and transduction 
            problems such as language modeling and machine translation. Numerous efforts have since continued 
            to push the boundaries of recurrent language models and encoder-decoder architectures.
          </p>
          
          <p className="mb-4">
            Recurrent models typically factor computation along the symbol positions of the input and output 
            sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden 
            states ht, as a function of the previous hidden state ht−1 and the input for position t. This 
            inherently sequential nature precludes parallelization within training examples, which becomes 
            critical at longer sequence lengths, as memory constraints limit batching across examples.
          </p>

          <p>
            In this work we propose the Transformer, a model architecture eschewing recurrence and instead 
            relying entirely on an attention mechanism to draw global dependencies between input and output. 
            The Transformer allows for significantly more parallelization and can reach a new state of the 
            art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.
          </p>
        </section>

        <section id="related-work">
          <h2 className="text-2xl font-semibold mb-4">2. Related Work</h2>
          <p className="mb-4">
            The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, 
            ByteNet and ConvS2S, all of which use convolutional neural networks as basic building block, 
            computing hidden representations in parallel for all input and output positions. In these models, 
            the number of operations required to relate signals from two arbitrary input or output positions 
            grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet.
          </p>

          <p>
            Self-attention, sometimes called intra-attention is an attention mechanism relating different 
            positions of a single sequence in order to compute a representation of the sequence. Self-attention 
            has been used successfully in a variety of tasks including reading comprehension, abstractive 
            summarization and textual entailment.
          </p>
        </section>

        <section id="methodology">
          <h2 className="text-2xl font-semibold mb-4">3. Methodology</h2>
          <p className="mb-4">
            Most competitive neural sequence transduction models have an encoder-decoder structure. Here, 
            the encoder maps an input sequence of symbol representations (x1, ..., xn) to a sequence of 
            continuous representations z = (z1, ..., zn). Given z, the decoder then generates an output 
            sequence (y1, ..., ym) of symbols one element at a time.
          </p>

          <section id="model-architecture" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">3.1 Model Architecture</h3>
            <p className="mb-4">
              The Transformer follows this overall architecture using stacked self-attention and point-wise, 
              fully connected layers for both the encoder and decoder, shown in the left and right halves 
              of Figure 1, respectively.
            </p>
          </section>

          <section id="training-procedure" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">3.2 Training Procedure</h3>
            <p>
              We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million 
              sentence pairs. Sentences were encoded using byte-pair encoding, which has a shared 
              source-target vocabulary of about 37000 tokens.
            </p>
          </section>
        </section>

        <section id="experiments">
          <h2 className="text-2xl font-semibold mb-4">4. Experiments</h2>
          <p className="mb-4">
            In this section, we evaluate the Transformer on two machine translation tasks: WMT 2014 
            English-to-German translation and WMT 2014 English-to-French translation.
          </p>

          <section id="datasets" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">4.1 Datasets</h3>
            <p>
              We used the WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs, 
              and the WMT 2014 English-French dataset consisting of 36M sentences.
            </p>
          </section>

          <section id="evaluation-metrics" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">4.2 Evaluation Metrics</h3>
            <p>
              We used BLEU scores to evaluate translation quality, following standard practices in 
              machine translation evaluation.
            </p>
          </section>

          <section id="results" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">4.3 Results</h3>
            <p>
              On the WMT 2014 English-to-German translation task, the big transformer model 
              (Transformer (big)) outperforms the best previously reported models including 
              ensembles by more than 2.0 BLEU.
            </p>
          </section>
        </section>

        <section id="discussion">
          <h2 className="text-2xl font-semibold mb-4">5. Discussion</h2>
          <p className="mb-4">
            In this work, we presented the Transformer, the first sequence transduction model based 
            entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder 
            architectures with multi-headed self-attention.
          </p>

          <section id="limitations" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">5.1 Limitations</h3>
            <p>
              While the Transformer achieves excellent results, it requires significant computational 
              resources and may not be suitable for all applications with limited resources.
            </p>
          </section>

          <section id="future-work" className="ml-4">
            <h3 className="text-xl font-semibold mb-3">5.2 Future Work</h3>
            <p>
              Future work includes investigating the application of Transformer architectures to other 
              modalities and exploring more efficient attention mechanisms.
            </p>
          </section>
        </section>

        <section id="conclusion">
          <h2 className="text-2xl font-semibold mb-4">6. Conclusion</h2>
          <p>
            We presented the Transformer, a novel neural network architecture based solely on attention 
            mechanisms. Our model achieves state-of-the-art performance on machine translation tasks 
            while being more parallelizable and requiring significantly less time to train than 
            recurrent models.
          </p>
        </section>

        <section id="references">
          <h2 className="text-2xl font-semibold mb-4">References</h2>
          <div className="space-y-2 text-sm">
            <p>[1] Dzmitry Bahdanau, Kyunghyun Cho, and Yoshua Bengio. Neural machine translation by jointly learning to align and translate. arXiv preprint arXiv:1409.0473, 2014.</p>
            <p>[2] Denny Britz, Anna Goldie, Minh-Thang Luong, and Quoc V. Le. Massive exploration of neural machine translation architectures. CoRR, abs/1703.03906, 2017.</p>
            <p>[3] Jianpeng Cheng, Li Dong, and Mirella Lapata. Long short-term memory-networks for machine reading. arXiv preprint arXiv:1601.06733, 2016.</p>
          </div>
        </section>
      </article>
    </MainLayout>
  )
}
