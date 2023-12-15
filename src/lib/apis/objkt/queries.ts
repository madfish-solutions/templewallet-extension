import { gql } from '@apollo/client';

export const buildGetCollectiblesQuery = () => gql`
  query CollectiblesQuery($where: token_bool_exp) {
    token(where: $where) {
      fa_contract
      token_id
      tags {
        tag {
          name
        }
      }
      listings_active(limit: 1, order_by: { price_xtz: asc }) {
        currency_id
        price
      }
      description
      mime
      artifact_uri
      timestamp
      metadata
      creators {
        holder {
          address
          tzdomain
        }
      }
      fa {
        name
        logo
        editions
      }
      galleries {
        gallery {
          name
          pk
          editions
        }
      }
      attributes {
        attribute {
          id
          name
          value
          attribute_counts {
            fa_contract
            editions
          }
        }
      }
      supply
      royalties {
        decimals
        amount
      }
    }
  }
`;

export const buildGetGalleriesAttributesCountsQuery = () => gql`
  query GalleriesAttributesQuery($where: gallery_attribute_count_bool_exp) {
    gallery_attribute_count(where: $where) {
      attribute_id
      gallery_pk
      editions
    }
  }
`;

export const buildGetCollectibleExtraQuery = () => gql`
  query CollectiblesExtraQuery($where: token_bool_exp) {
    token(where: $where) {
      offers_active(order_by: { price_xtz: desc }) {
        buyer_address
        price
        currency_id
        bigmap_key
        marketplace_contract
      }
    }
  }
`;
